import { mount } from '@vue/test-utils';
import { beforeAll, describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { registerEtsIcons } from '../icons';
import NumberInput from './NumberInput.vue';

beforeAll(() => registerEtsIcons());

function harness(
  opts: {
    initial?: string;
    prefixUnit?: string;
    suffixUnit?: string;
    fractionDigits?: number;
    locale?: string;
  } = {},
) {
  const model = ref<string | undefined>(opts.initial ?? '');
  const Comp = defineComponent({
    setup() {
      return () =>
        h(NumberInput, {
          modelValue: model.value,
          'onUpdate:modelValue': (v: string | undefined) => {
            model.value = v;
          },
          label: 'Amount',
          prefixUnit: opts.prefixUnit,
          suffixUnit: opts.suffixUnit,
          fractionDigits: opts.fractionDigits,
          locale: opts.locale ?? 'en-AU',
        });
    },
  });
  return { Comp, model };
}

describe('NumberInput', () => {
  it('shows grouped display but keeps a raw model', async () => {
    const { Comp, model } = harness({ initial: '1234.5', prefixUnit: '$', locale: 'en-AU' });
    const wrapper = mount(Comp);
    await nextTick();

    expect(wrapper.text()).toContain('$');
    const input = wrapper.find('input');
    expect((input.element as HTMLInputElement).value).toBe('1,234.50');
    expect(model.value).toBe('1234.5');

    await wrapper.find('.r-field').trigger('focusin');
    await nextTick();
    expect((input.element as HTMLInputElement).value).toBe('1234.5');

    await input.setValue('1');
    await nextTick();
    expect((input.element as HTMLInputElement).value).toBe('1');
    expect(model.value).toBe('1');

    await input.setValue('178.4');
    await nextTick();
    expect((input.element as HTMLInputElement).value).toBe('178.4');
    expect(model.value).toBe('178.4');

    await wrapper.find('.r-field').trigger('focusout');
    await nextTick();
    expect((input.element as HTMLInputElement).value).toBe('178.40');
    expect(model.value).toBe('178.40');
  });

  it('respects fractionDigits and shows suffix chrome', async () => {
    const { Comp, model } = harness({
      initial: '1000',
      suffixUnit: 'certs',
      fractionDigits: 0,
      locale: 'en-AU',
    });
    const wrapper = mount(Comp);
    await nextTick();

    expect(wrapper.text()).toContain('certs');
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('1,000');
    expect(model.value).toBe('1000');
  });

  it('renders prefix and suffix together', async () => {
    const { Comp, model } = harness({
      initial: '178.456',
      prefixUnit: '$',
      suffixUnit: '/MW',
      fractionDigits: 2,
      locale: 'en-AU',
    });
    const wrapper = mount(Comp);
    await nextTick();

    expect(wrapper.text()).toContain('$');
    expect(wrapper.text()).toContain('/MW');
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('178.46');
    expect(model.value).toBe('178.456');
  });

  it('keeps digits and period only, and accepts pasted thousands separators', async () => {
    const { Comp, model } = harness({ initial: '', locale: 'en-AU' });
    const wrapper = mount(Comp);
    await nextTick();

    const input = wrapper.find('input');
    await wrapper.find('.r-field').trigger('focusin');
    await nextTick();

    await input.setValue('12a3b');
    await nextTick();
    expect((input.element as HTMLInputElement).value).toBe('123');
    expect(model.value).toBe('123');

    await input.setValue('1,234.5');
    await nextTick();
    expect((input.element as HTMLInputElement).value).toBe('1234.5');
    expect(model.value).toBe('1234.5');

    await wrapper.find('.r-field').trigger('focusout');
    await nextTick();
    expect((input.element as HTMLInputElement).value).toBe('1,234.50');
    expect(model.value).toBe('1234.50');
  });
});
