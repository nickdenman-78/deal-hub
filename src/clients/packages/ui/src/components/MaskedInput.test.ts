import { mount } from '@vue/test-utils';
import { beforeAll, describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { registerEtsIcons } from '../icons';
import MaskedInput from './MaskedInput.vue';
import { formatCurrency, maskAuMobile, normalizeIdName, unformatAuMobile, unformatCurrency } from './mask';

beforeAll(() => registerEtsIcons());

function harness(
  opts: {
    mask?: (raw: string) => string;
    blurMask?: (raw: string) => string;
    modelRef?: ReturnType<typeof ref<string | undefined>>;
  } = {},
) {
  return defineComponent({
    setup() {
      const model = opts.modelRef ?? ref<string | undefined>('');
      return () =>
        h(MaskedInput, {
          modelValue: model.value,
          'onUpdate:modelValue': (v: string | undefined) => {
            model.value = v;
          },
          mask: opts.mask,
          blurMask: opts.blurMask,
          label: 'Field',
        });
    },
  });
}

describe('MaskedInput', () => {
  it('sanitises into the model on every update', async () => {
    const model = ref<string | undefined>('');
    const wrapper = mount(harness({ mask: normalizeIdName, modelRef: model }));

    await wrapper.find('.r-masked').trigger('focusin');
    await nextTick();
    await wrapper.find('input').setValue('Foo Bar');
    await nextTick();

    expect(model.value).toBe('foo-bar');
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('foo-bar');
  });

  it('normalises an external prefill into the raw model', async () => {
    const model = ref<string | undefined>('Foo Bar');
    const wrapper = mount(harness({ mask: normalizeIdName, modelRef: model }));
    await nextTick();

    expect(model.value).toBe('foo-bar');
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('foo-bar');
  });

  it('passes through without a mask', async () => {
    const wrapper = mount(harness());

    await wrapper.find('input').setValue('Foo Bar');
    await nextTick();

    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('Foo Bar');
  });

  it('keeps formatting out of the model and only shows it when resting', async () => {
    const mobile = ref<string | undefined>('0412345678');
    const wrapper = mount(
      harness({
        mask: unformatAuMobile,
        blurMask: maskAuMobile,
        modelRef: mobile,
      }),
    );
    await nextTick();

    expect(mobile.value).toBe('0412345678');
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('0412 345 678');

    await wrapper.find('.r-masked').trigger('focusin');
    await nextTick();
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('0412345678');

    await wrapper.find('input').setValue('0412 999 999');
    await nextTick();
    expect(mobile.value).toBe('0412999999');
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('0412999999');

    await wrapper.find('.r-masked').trigger('focusout');
    await nextTick();
    expect(mobile.value).toBe('0412999999');
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('0412 999 999');
  });

  it('formats currency for display on blur without writing separators to the model', async () => {
    const model = ref<string | undefined>('1234.5');
    const wrapper = mount(
      harness({
        mask: unformatCurrency,
        blurMask: (v) => formatCurrency(v, { locale: 'en-AU' }),
        modelRef: model,
      }),
    );
    await nextTick();

    const input = wrapper.find('input');
    expect(model.value).toBe('1234.5');
    expect((input.element as HTMLInputElement).value).toBe('1,234.50');

    await wrapper.find('.r-masked').trigger('focusin');
    await nextTick();
    expect((input.element as HTMLInputElement).value).toBe('1234.5');

    await input.setValue('98765.4');
    await nextTick();
    expect(model.value).toBe('98765.4');
    expect((input.element as HTMLInputElement).value).toBe('98765.4');

    await wrapper.find('.r-masked').trigger('focusout');
    await nextTick();
    expect(model.value).toBe('98765.4');
    expect((input.element as HTMLInputElement).value).toBe('98,765.40');
  });

  it('keeps the caret when sanitising mid-value', async () => {
    const model = ref<string | undefined>('4111111111111111');
    const wrapper = mount(
      harness({
        mask: (v) => v.replace(/\D+/g, '').slice(0, 19),
        blurMask: (v) =>
          v
            .replace(/\D+/g, '')
            .match(/.{1,4}/g)
            ?.join(' ') ?? '',
        modelRef: model,
      }),
      { attachTo: document.body },
    );
    await nextTick();

    await wrapper.find('.r-masked').trigger('focusin');
    await nextTick();

    const el = wrapper.find('input').element as HTMLInputElement;
    expect(el.value).toBe('4111111111111111');
    el.focus();
    el.setSelectionRange(4, 4);
    el.value = '41119111111111111';
    el.setSelectionRange(5, 5);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    await nextTick();
    await nextTick();

    expect(el.value).toBe('41119111111111111');
    expect(el.selectionStart).toBe(5);

    wrapper.unmount();
  });

  it('re-applies blurMask when the formatter changes while resting', async () => {
    const model = ref<string | undefined>('4111111111111111');
    const blurMask = ref<(raw: string) => string>(
      (v) =>
        v
          .replace(/\D+/g, '')
          .match(/.{1,4}/g)
          ?.join(' ') ?? '',
    );
    const wrapper = mount(
      defineComponent({
        setup() {
          return () =>
            h(MaskedInput, {
              modelValue: model.value,
              'onUpdate:modelValue': (v: string | undefined) => {
                model.value = v;
              },
              mask: (v) => v.replace(/\D+/g, '').slice(0, 19),
              blurMask: blurMask.value,
              label: 'Field',
            });
        },
      }),
    );
    await nextTick();

    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('4111 1111 1111 1111');

    blurMask.value = () => '**** **** **** 1111';
    await nextTick();

    expect(model.value).toBe('4111111111111111');
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('**** **** **** 1111');
  });
});
