import { mount } from '@vue/test-utils';
import { beforeAll, describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { registerEtsIcons } from '../icons';
import Ipv4Editor from './Ipv4Editor.vue';

beforeAll(() => registerEtsIcons());

function harness(opts: { format?: 'address' | 'cidr' | 'either'; initial?: string; showSubnetInfo?: boolean }) {
  const model = ref<string | undefined>(opts.initial ?? '');
  const Comp = defineComponent({
    setup: () => () =>
      h(Ipv4Editor, {
        modelValue: model.value,
        'onUpdate:modelValue': (v: string | undefined) => {
          model.value = v;
        },
        format: opts.format ?? 'either',
        showSubnetInfo: opts.showSubnetInfo,
        label: 'Address',
      }),
  });
  return { Comp, model };
}

describe('Ipv4Editor navigation', () => {
  it('advances on period from a partial octet, including into the CIDR prefix', async () => {
    const { Comp } = harness({ format: 'cidr', initial: '' });
    const wrapper = mount(Comp, { attachTo: document.body });
    await nextTick();

    const inputs = wrapper.findAll('input');
    expect(inputs).toHaveLength(5);

    const first = inputs[0]!.element as HTMLInputElement;
    first.focus();
    await inputs[0]!.setValue('10');
    await inputs[0]!.trigger('keydown', { key: '.' });
    await nextTick();
    expect(document.activeElement).toBe(inputs[1]!.element);

    const fourth = inputs[3]!.element as HTMLInputElement;
    fourth.focus();
    await inputs[3]!.setValue('1');
    await inputs[3]!.trigger('keydown', { key: '.' });
    await nextTick();
    expect(document.activeElement).toBe(inputs[4]!.element);

    wrapper.unmount();
  });

  it('advances on period when the octet is already full (maxlength)', async () => {
    const { Comp } = harness({ format: 'cidr', initial: '10.0.0.255' });
    const wrapper = mount(Comp, { attachTo: document.body });
    await nextTick();

    const inputs = wrapper.findAll('input');
    const lastOctet = inputs[3]!.element as HTMLInputElement;
    lastOctet.focus();
    await inputs[3]!.trigger('keydown', { key: '.' });
    await nextTick();
    expect(document.activeElement).toBe(inputs[4]!.element);

    wrapper.unmount();
  });

  it('does not skip an octet when period is pressed in an empty box after auto-advance', async () => {
    const { Comp } = harness({ format: 'address', initial: '' });
    const wrapper = mount(Comp, { attachTo: document.body });
    await nextTick();

    const inputs = wrapper.findAll('input');
    await inputs[0]!.setValue('255');
    await nextTick();
    // Auto-advance landed on octet 2 (index 1).
    expect(document.activeElement).toBe(inputs[1]!.element);

    await inputs[1]!.trigger('keydown', { key: '.' });
    await nextTick();
    // Empty box — habitual trailing '.' must not skip to octet 3.
    expect(document.activeElement).toBe(inputs[1]!.element);

    wrapper.unmount();
  });

  it('ignores the first period after auto-advance even when the next octet has a value', async () => {
    const { Comp } = harness({ format: 'address', initial: '10.20.0.0' });
    const wrapper = mount(Comp, { attachTo: document.body });
    await nextTick();

    const inputs = wrapper.findAll('input');
    (inputs[0]!.element as HTMLInputElement).focus();
    await inputs[0]!.setValue('255');
    await nextTick();
    expect(document.activeElement).toBe(inputs[1]!.element);

    await inputs[1]!.trigger('keydown', { key: '.' });
    await nextTick();
    // Next box already held "20" (selected on focus) — still must not skip.
    expect(document.activeElement).toBe(inputs[1]!.element);

    wrapper.unmount();
  });

  it('disables the subnet info control until the CIDR is valid', async () => {
    const { Comp, model } = harness({ format: 'cidr', initial: '10.0.0', showSubnetInfo: true });
    const wrapper = mount(Comp, { attachTo: document.body });
    await nextTick();

    const info = wrapper.find('.r-ip__info .r-popover__activator');
    expect(info.attributes('disabled')).toBeDefined();
    expect(info.attributes('tabindex')).toBe('-1');

    model.value = '10.0.0.0/24';
    await nextTick();
    expect(wrapper.find('.r-ip__info .r-popover__activator').attributes('disabled')).toBeUndefined();

    wrapper.unmount();
  });

  it('enables the info control for a valid host address', async () => {
    const { Comp, model } = harness({ format: 'address', initial: '10.0.0', showSubnetInfo: true });
    const wrapper = mount(Comp, { attachTo: document.body });
    await nextTick();

    expect(wrapper.find('.r-ip__info .r-popover__activator').attributes('disabled')).toBeDefined();

    model.value = '10.24.6.19';
    await nextTick();
    expect(wrapper.find('.r-ip__info .r-popover__activator').attributes('disabled')).toBeUndefined();

    wrapper.unmount();
  });

  it('opens subnet info with Alt+ArrowDown when the CIDR is valid', async () => {
    const { Comp } = harness({ format: 'cidr', initial: '10.0.0.0/24', showSubnetInfo: true });
    const wrapper = mount(Comp, { attachTo: document.body });
    await nextTick();

    const inputs = wrapper.findAll('input');
    (inputs[0]!.element as HTMLInputElement).focus();
    await inputs[0]!.trigger('keydown', { key: 'ArrowDown', altKey: true });
    await nextTick();

    expect(wrapper.find('.r-ip__info .r-popover__activator').attributes('aria-expanded')).toBe('true');

    wrapper.unmount();
  });

  it('does not open subnet info with Alt+ArrowDown while the CIDR is invalid', async () => {
    const { Comp } = harness({ format: 'cidr', initial: '10.0.0', showSubnetInfo: true });
    const wrapper = mount(Comp, { attachTo: document.body });
    await nextTick();

    const inputs = wrapper.findAll('input');
    (inputs[0]!.element as HTMLInputElement).focus();
    await inputs[0]!.trigger('keydown', { key: 'ArrowDown', altKey: true });
    await nextTick();

    expect(wrapper.find('.r-ip__info .r-popover__activator').attributes('aria-expanded')).not.toBe('true');

    wrapper.unmount();
  });
});
