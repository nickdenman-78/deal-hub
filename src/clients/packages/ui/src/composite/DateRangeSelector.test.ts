import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import DateRangeSelector from './DateRangeSelector.vue';
import { DEFAULT_DATE_RANGE_PRESETS, localToday } from './dateRangePresets';

describe('DateRangeSelector', () => {
  it('selecting a preset writes a resolved DateRange and closes', async () => {
    const wrapper = mount(DateRangeSelector, {
      props: {
        modelValue: {},
        'onUpdate:modelValue': (v: { from?: string; to?: string }) => wrapper.setProps({ modelValue: v }),
      },
      attachTo: document.body,
    });

    await wrapper.find('.r-drs__trigger').trigger('click');
    await nextTick();

    const first = DEFAULT_DATE_RANGE_PRESETS[0]!;
    const option = [...document.querySelectorAll<HTMLElement>('[role="option"]')].find(
      (el) => el.textContent?.trim() === first.label,
    );
    expect(option).toBeTruthy();
    option!.click();
    await nextTick();

    expect(wrapper.props('modelValue')).toEqual(first.resolve({ today: localToday() }));
    wrapper.unmount();
  });

  it('Custom Apply commits the draft range', async () => {
    const wrapper = mount(DateRangeSelector, {
      props: {
        modelValue: {},
        'onUpdate:modelValue': (v: { from?: string; to?: string }) => wrapper.setProps({ modelValue: v }),
      },
      attachTo: document.body,
    });

    await wrapper.find('.r-drs__trigger').trigger('click');
    await nextTick();

    const custom = [...document.querySelectorAll<HTMLElement>('[role="option"]')].find(
      (el) => el.textContent?.trim() === 'Custom…',
    );
    custom!.click();
    await nextTick();

    const inputs = document.querySelectorAll<HTMLInputElement>('input[type="date"]');
    expect(inputs.length).toBeGreaterThanOrEqual(2);
    inputs[0]!.value = '2026-07-01';
    inputs[0]!.dispatchEvent(new Event('input', { bubbles: true }));
    inputs[1]!.value = '2026-07-31';
    inputs[1]!.dispatchEvent(new Event('input', { bubbles: true }));
    await nextTick();

    const apply = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Apply');
    apply!.click();
    await nextTick();

    expect(wrapper.props('modelValue')).toEqual({ from: '2026-07-01', to: '2026-07-31' });
    wrapper.unmount();
  });

  it('Escape on the custom panel returns to the list', async () => {
    const wrapper = mount(DateRangeSelector, {
      props: { modelValue: {} },
      attachTo: document.body,
    });

    await wrapper.find('.r-drs__trigger').trigger('click');
    await nextTick();
    const custom = [...document.querySelectorAll<HTMLElement>('[role="option"]')].find(
      (el) => el.textContent?.trim() === 'Custom…',
    );
    custom!.click();
    await nextTick();

    const panel = document.querySelector('.r-drs__panel')!;
    expect(panel.getAttribute('role')).toBe('dialog');
    expect(panel.querySelector('.r-drs__custom-sep')).toBeTruthy();
    panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await nextTick();

    expect(document.querySelector('.r-drs__panel')?.getAttribute('role')).toBe('listbox');
    expect(document.querySelectorAll('[role="option"]').length).toBeGreaterThan(0);
    wrapper.unmount();
  });

  it('opens the list from the trigger with ArrowDown or Enter', async () => {
    const wrapper = mount(DateRangeSelector, {
      props: { modelValue: {} },
      attachTo: document.body,
    });

    const trigger = wrapper.find('.r-drs__trigger');
    await trigger.trigger('keydown', { key: 'ArrowDown' });
    await nextTick();
    expect(document.querySelectorAll('[role="option"]').length).toBeGreaterThan(0);

    document.querySelector<HTMLElement>('[role="option"]')?.click();
    await nextTick();

    await trigger.trigger('keydown', { key: 'Enter' });
    await nextTick();
    expect(document.querySelectorAll('[role="option"]').length).toBeGreaterThan(0);
    wrapper.unmount();
  });

  it('month granularity labels a custom range by month and snaps Apply to whole months', async () => {
    const wrapper = mount(DateRangeSelector, {
      props: {
        granularity: 'month' as const,
        presets: [],
        modelValue: { from: '2026-03-15', to: '2026-05-10' },
        'onUpdate:modelValue': (v: { from?: string; to?: string }) => wrapper.setProps({ modelValue: v }),
      },
      attachTo: document.body,
    });

    expect(wrapper.find('.r-drs__value').text()).toMatch(/Mar.*2026 – May.*2026/);

    await wrapper.find('.r-drs__trigger').trigger('click');
    await nextTick();
    const custom = [...document.querySelectorAll<HTMLElement>('[role="option"]')].find(
      (el) => el.textContent?.trim() === 'Custom…',
    );
    custom!.click();
    await nextTick();

    expect(document.querySelectorAll('.r-drs__custom input[type="date"]').length).toBe(0);
    const apply = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Apply');
    apply!.click();
    await nextTick();

    expect(wrapper.props('modelValue')).toEqual({ from: '2026-03-01', to: '2026-05-31' });
    wrapper.unmount();
  });
});
