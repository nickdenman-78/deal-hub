import { mount } from '@vue/test-utils';
import { beforeAll, describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { registerEtsIcons } from '../icons';
import AbnAcnInput from './AbnAcnInput.vue';
import type { AbnAcnKind } from './abnAcn';
import { detectAbnAcnKind, digitsOnly } from './abnAcn';

beforeAll(() => registerEtsIcons());

function harness(opts: {
  model: ReturnType<typeof ref<string | undefined>>;
  kind?: ReturnType<typeof ref<AbnAcnKind>>;
  kindSelector?: boolean;
  label?: string;
}) {
  return defineComponent({
    setup: () => () =>
      h(AbnAcnInput, {
        modelValue: opts.model.value,
        'onUpdate:modelValue': (v: string | undefined) => {
          opts.model.value = v;
        },
        ...(opts.kind
          ? {
              kind: opts.kind.value,
              'onUpdate:kind': (v: AbnAcnKind) => {
                opts.kind!.value = v;
              },
            }
          : {}),
        kindSelector: opts.kindSelector,
        label: opts.label ?? 'Business ID',
      }),
  });
}

describe('detectAbnAcnKind / digitsOnly', () => {
  it('strips spaces and other non-digits', () => {
    expect(digitsOnly('51 824 753 556', 11)).toBe('51824753556');
    expect(digitsOnly('004-085-616', 9)).toBe('004085616');
  });

  it('detects ABN vs ACN by digit length', () => {
    expect(detectAbnAcnKind('51 824 753 556')).toBe('abn');
    expect(detectAbnAcnKind('51824753556')).toBe('abn');
    expect(detectAbnAcnKind('004 085 616')).toBe('acn');
    expect(detectAbnAcnKind('004085616')).toBe('acn');
    expect(detectAbnAcnKind('51824')).toBeUndefined();
  });
});

describe('AbnAcnInput', () => {
  it('shows a grouped ABN when resting and keeps digits in the model', async () => {
    const model = ref<string | undefined>('51824753556');
    const wrapper = mount(harness({ model, label: 'ABN' }));
    await nextTick();
    expect(model.value).toBe('51824753556');
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('51 824 753 556');
  });

  it('shows a grouped ACN when kind is acn', async () => {
    const model = ref<string | undefined>('004085616');
    const wrapper = mount(harness({ model, kind: ref<AbnAcnKind>('acn'), label: 'ACN' }));
    await nextTick();
    expect(model.value).toBe('004085616');
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('004 085 616');
  });

  it('shows a kind selector that truncates digits for ACN', async () => {
    const model = ref<string | undefined>('51824753556');
    const kind = ref<AbnAcnKind>('abn');
    const wrapper = mount(harness({ model, kind, kindSelector: true }));
    await nextTick();

    expect(wrapper.findAll('.r-field__kind-btn')).toHaveLength(2);
    await wrapper.findAll('.r-field__kind-btn')[1]!.trigger('click');
    await nextTick();

    expect(kind.value).toBe('acn');
    expect(model.value).toBe('518247535');
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('518 247 535');
  });

  it('keeps the caret when editing mid-value', async () => {
    const model = ref<string | undefined>('51824753556');
    const wrapper = mount(harness({ model, label: 'ABN' }), { attachTo: document.body });
    await nextTick();

    await wrapper.find('.r-abn-acn').trigger('focusin');
    await nextTick();

    const input = wrapper.find('input');
    const el = input.element as HTMLInputElement;
    expect(el.value).toBe('51824753556');

    el.focus();
    el.setSelectionRange(2, 2);
    el.value = '510824753556';
    el.setSelectionRange(3, 3);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    await nextTick();
    await nextTick();

    expect(el.value).toBe('51082475355');
    expect(el.selectionStart).toBe(3);
    expect(model.value).toBe('51082475355');

    wrapper.unmount();
  });

  it('accepts typed or pasted values with spaces into a raw model', async () => {
    const model = ref<string | undefined>(undefined);
    const wrapper = mount(harness({ model, label: 'ABN' }), { attachTo: document.body });
    await nextTick();

    await wrapper.find('.r-abn-acn').trigger('focusin');
    await nextTick();

    await wrapper.find('input').setValue('51 824 753 556');
    await nextTick();
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('51824753556');
    expect(model.value).toBe('51824753556');

    await wrapper.find('.r-abn-acn').trigger('focusout');
    await nextTick();
    expect(model.value).toBe('51824753556');
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('51 824 753 556');

    wrapper.unmount();
  });

  it('auto-detects kind from paste when kindSelector is on', async () => {
    const model = ref<string | undefined>(undefined);
    const kind = ref<AbnAcnKind>('abn');
    const wrapper = mount(harness({ model, kind, kindSelector: true }), { attachTo: document.body });
    await nextTick();

    await wrapper.find('.r-abn-acn').trigger('focusin');
    await nextTick();

    const paste = (text: string) => {
      const event = new Event('paste', { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'clipboardData', {
        value: { getData: (type: string) => (type === 'text' || type === 'text/plain' ? text : '') },
      });
      wrapper.find('.r-abn-acn').element.dispatchEvent(event);
    };

    paste('004 085 616');
    await nextTick();
    expect(kind.value).toBe('acn');

    await wrapper.find('input').setValue('004 085 616');
    await nextTick();
    expect(model.value).toBe('004085616');

    paste('51824753556');
    await nextTick();
    expect(kind.value).toBe('abn');

    wrapper.unmount();
  });

  it('validates on overall control blur, not when focus moves to the kind buttons', async () => {
    const model = ref<string | undefined>('12345678901');
    const kind = ref<AbnAcnKind>('abn');
    const wrapper = mount(harness({ model, kind, kindSelector: true }), { attachTo: document.body });
    await nextTick();

    const root = wrapper.find('.r-abn-acn').element;
    const input = wrapper.find('input').element as HTMLInputElement;
    const acnBtn = wrapper.findAll('.r-field__kind-btn')[1]!.element;

    input.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: acnBtn }));
    await nextTick();
    expect(wrapper.find('.r-field__error').text()).toBe('');

    await wrapper.findAll('.r-field__kind-btn')[1]!.trigger('click');
    await nextTick();
    expect(kind.value).toBe('acn');

    root.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
    await nextTick();
    expect(wrapper.find('.r-field__error').text()).toMatch(/ACN/);

    wrapper.unmount();
  });

  it('re-validates the active kind when the control loses focus', async () => {
    const model = ref<string | undefined>('51824753556');
    const wrapper = mount(harness({ model, label: 'ABN' }), { attachTo: document.body });
    await nextTick();

    const root = wrapper.find('.r-abn-acn').element;
    root.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
    await nextTick();
    expect(wrapper.find('.r-field__error').text()).toBe('');

    await wrapper.find('.r-abn-acn').trigger('focusin');
    await nextTick();
    await wrapper.find('input').setValue('12345678901');
    await nextTick();
    root.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
    await nextTick();
    expect(wrapper.find('.r-field__error').text()).toMatch(/ABN|checksum|digits/i);

    wrapper.unmount();
  });
});
