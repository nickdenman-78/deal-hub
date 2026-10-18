import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import RadioGroup from './RadioGroup.vue';

const OPTIONS = [
  { value: 'now', label: 'Now', description: 'Run immediately.' },
  { value: 'once', label: 'Later' },
  { value: 'recurring', label: 'Recurring schedule', disabled: true },
];

describe('RadioGroup', () => {
  it('renders a radiogroup with one radio per option', () => {
    const wrapper = mount(RadioGroup, { props: { label: 'Schedule', options: OPTIONS } });

    expect(wrapper.find('[role="radiogroup"]').exists()).toBe(true);
    expect(wrapper.findAll('[role="radio"]')).toHaveLength(3);
  });

  it('reports the selection through aria-checked', () => {
    const wrapper = mount(RadioGroup, {
      props: { label: 'Schedule', options: OPTIONS, modelValue: 'once' },
    });

    const checked = wrapper.findAll('[role="radio"]').map((r) => r.attributes('aria-checked'));
    expect(checked).toEqual(['false', 'true', 'false']);
  });

  it('emits the option value on click', async () => {
    const wrapper = mount(RadioGroup, { props: { label: 'Schedule', options: OPTIONS } });

    await wrapper.findAll('[role="radio"]')[1]!.trigger('click');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['once']);
  });

  it('does not select a disabled option', async () => {
    const wrapper = mount(RadioGroup, { props: { label: 'Schedule', options: OPTIONS } });

    await wrapper.findAll('[role="radio"]')[2]!.trigger('click');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  /*
   * Radio.Root renders a <button role="radio">, and a <label for> pointing at
   * a button associates with nothing — same silent failure Checkbox documents.
   * aria-labelledby is the association that actually holds.
   */
  it('labels each radio by reference, not with a <label for>', () => {
    const wrapper = mount(RadioGroup, { props: { label: 'Schedule', options: OPTIONS } });

    const first = wrapper.findAll('[role="radio"]')[0]!;
    const labelledBy = first.attributes('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    expect(wrapper.find(`#${labelledBy}`).text()).toBe('Now');

    const describedBy = first.attributes('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(wrapper.find(`#${describedBy}`).text()).toBe('Run immediately.');
  });

  it('selects when the label text is clicked, as a real label would', async () => {
    const wrapper = mount(RadioGroup, { props: { label: 'Schedule', options: OPTIONS } });

    await wrapper.findAll('.r-radios__label')[0]!.trigger('click');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['now']);
  });

  it('does not select when a disabled option label is clicked', async () => {
    const wrapper = mount(RadioGroup, { props: { label: 'Schedule', options: OPTIONS } });

    await wrapper.findAll('.r-radios__label')[2]!.trigger('click');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  /* The circle must be visible while UNCHECKED — it is the thing you aim at.
     v0 hides Radio.Indicator when unchecked, so the circle cannot live there. */
  it('renders the circle outside the indicator, so it is visible unchecked', () => {
    const wrapper = mount(RadioGroup, { props: { label: 'Schedule', options: OPTIONS } });

    const circle = wrapper.find('.r-radios__circle');
    expect(circle.exists()).toBe(true);
    expect((circle.element as HTMLElement).style.visibility).not.toBe('hidden');
  });

  /* v0 never selects a disabled item, so a disabled group used to show no
     selection — "nothing chosen" instead of "fixed to this". */
  it('still shows the selection when the whole group is disabled', () => {
    const wrapper = mount(RadioGroup, {
      props: { label: 'Schedule', options: OPTIONS, modelValue: 'once', disabled: true },
    });

    const radios = wrapper.findAll('[role="radio"]');
    expect(radios.map((r) => r.attributes('aria-checked'))).toEqual(['false', 'true', 'false']);
    expect(radios.every((r) => r.attributes('aria-disabled') === 'true')).toBe(true);
    expect(wrapper.findAll('.r-radios__dot')).toHaveLength(1);
  });

  it('shows the selection of a disabled group whose options arrive after mount', async () => {
    const wrapper = mount(RadioGroup, {
      props: { label: 'Schedule', options: [] as typeof OPTIONS, modelValue: 'once', disabled: true },
    });

    await wrapper.setProps({ options: OPTIONS });
    expect(wrapper.findAll('[role="radio"]').map((r) => r.attributes('aria-checked'))).toEqual([
      'false',
      'true',
      'false',
    ]);
  });

  it('ignores clicks while the group is disabled', async () => {
    const wrapper = mount(RadioGroup, {
      props: { label: 'Schedule', options: OPTIONS, modelValue: 'once', disabled: true },
    });

    await wrapper.findAll('[role="radio"]')[0]!.trigger('click');
    await wrapper.findAll('.r-radios__label')[0]!.trigger('click');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });
});
