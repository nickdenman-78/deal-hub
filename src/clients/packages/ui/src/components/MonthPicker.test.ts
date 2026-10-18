import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import MonthPicker from './MonthPicker.vue';

/*
 * Opening the panel is NOT asserted here. v0's Popover depends on the browser
 * acting on `popovertarget`, the top layer and light dismissal, none of which
 * jsdom has — the same call `test/setup.ts` records for every popover control
 * in this package. Open behaviour is verified in apps/ui-showcase. What is
 * asserted is everything the DOM shows while closed, plus the grid, which is
 * rendered whether or not the panel is displayed.
 */

const AU = 'en-AU';

function cells(wrapper: ReturnType<typeof mount>) {
  return wrapper.findAll('.r-month__cell');
}

describe('MonthPicker', () => {
  it('shows the selected month as a name, not as the raw value', () => {
    const wrapper = mount(MonthPicker, {
      props: { label: 'Billing term', modelValue: '2026-08', locale: AU },
    });
    expect(wrapper.find('.r-month__value').text()).toBe('August 2026');
  });

  it('shows the placeholder when nothing is chosen', () => {
    const wrapper = mount(MonthPicker, { props: { label: 'Billing term', locale: AU } });
    const value = wrapper.find('.r-month__value');
    expect(value.text()).toBe('Select month…');
    expect(value.classes()).toContain('r-month__value--placeholder');
  });

  it('renders twelve cells and no more', () => {
    const wrapper = mount(MonthPicker, { props: { modelValue: '2026-08', locale: AU } });
    expect(cells(wrapper)).toHaveLength(12);
  });

  it('opens on the selected month’s year, not on today’s', () => {
    const wrapper = mount(MonthPicker, { props: { modelValue: '2019-03', locale: AU } });
    expect(wrapper.find('.r-month__year').text()).toBe('2019');
  });

  it('marks the selected cell, and only that one', () => {
    const wrapper = mount(MonthPicker, { props: { modelValue: '2026-08', locale: AU } });
    const selected = cells(wrapper).filter((cell) => cell.classes().includes('r-month__cell--selected'));

    expect(selected).toHaveLength(1);
    expect(selected[0].attributes('data-month')).toBe('8');
    expect(selected[0].attributes('aria-pressed')).toBe('true');
  });

  it('emits a yyyy-MM string, never a Date', async () => {
    const wrapper = mount(MonthPicker, { props: { modelValue: '2026-08', locale: AU } });
    await cells(wrapper)[2].trigger('click');

    const emitted = wrapper.emitted('update:modelValue')?.at(-1)?.[0];
    expect(emitted).toBe('2026-03');
    expect(typeof emitted).toBe('string');
  });

  /*
   * A roving tabindex, not twelve tab stops: the grid is one stop and the arrows
   * own movement inside it, which is the APG composite pattern.
   */
  it('leaves exactly one cell tabbable', () => {
    const wrapper = mount(MonthPicker, { props: { modelValue: '2026-08', locale: AU } });
    const tabbable = cells(wrapper).filter((cell) => cell.attributes('tabindex') === '0');

    expect(tabbable).toHaveLength(1);
    expect(tabbable[0].attributes('data-month')).toBe('8');
  });

  it('disables months outside min and max rather than hiding them', () => {
    const wrapper = mount(MonthPicker, {
      props: { modelValue: '2026-06', min: '2026-03', max: '2026-09', locale: AU },
    });
    const all = cells(wrapper);

    // Still twelve — the grid does not change shape.
    expect(all).toHaveLength(12);
    expect(all[0].attributes('disabled')).toBeDefined(); // January
    expect(all[2].attributes('disabled')).toBeUndefined(); // March, the min itself
    expect(all[8].attributes('disabled')).toBeUndefined(); // September, the max itself
    expect(all[9].attributes('disabled')).toBeDefined(); // October
  });

  it('refuses to select a disabled month', async () => {
    const wrapper = mount(MonthPicker, {
      props: { modelValue: '2026-06', min: '2026-03', locale: AU },
    });
    await cells(wrapper)[0].trigger('click');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  it('names each cell with its year, so the month alone is never ambiguous', () => {
    const wrapper = mount(MonthPicker, { props: { modelValue: '2026-08', locale: AU } });
    expect(cells(wrapper)[7].attributes('aria-label')).toBe('August 2026');
  });

  it('steps the year without touching the value', async () => {
    const wrapper = mount(MonthPicker, { props: { modelValue: '2026-08', locale: AU } });
    await wrapper.find('[aria-label="Previous year"]').trigger('click');

    expect(wrapper.find('.r-month__year').text()).toBe('2025');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    // And the grid now writes that year, not the value's.
    expect(cells(wrapper)[7].attributes('aria-label')).toBe('August 2025');
  });

  describe('read-only', () => {
    it('shows the month as a value and renders no trigger', () => {
      const wrapper = mount(MonthPicker, {
        props: { label: 'Billing term', modelValue: '2026-08', readonly: true, locale: AU },
      });

      expect(wrapper.classes()).toContain('r-field--readonly');
      expect(wrapper.find('.r-month__trigger').exists()).toBe(false);
      expect(cells(wrapper)).toHaveLength(0);
      expect(wrapper.find<HTMLInputElement>('input.r-field__readonly-input').element.value).toBe('August 2026');
    });

    it('is a tab stop named by the field label, like every other read-only field', () => {
      const wrapper = mount(MonthPicker, {
        props: { label: 'Billing term', modelValue: '2026-08', readonly: true, locale: AU },
      });
      const input = wrapper.find('input.r-field__readonly-input');

      expect(input.attributes('readonly')).toBeDefined();
      expect(wrapper.find('label.r-field__label').attributes('for')).toBe(input.attributes('id'));
    });

    it('withholds the clear control', () => {
      const wrapper = mount(MonthPicker, {
        props: { modelValue: '2026-08', clearable: true, readonly: true, locale: AU },
      });
      expect(wrapper.find('.r-month__clear').exists()).toBe(false);
    });
  });

  describe('clearable', () => {
    it('offers a clear control only once there is something to clear', () => {
      const empty = mount(MonthPicker, { props: { clearable: true, locale: AU } });
      expect(empty.find('.r-month__clear').exists()).toBe(false);

      const set = mount(MonthPicker, { props: { modelValue: '2026-08', clearable: true, locale: AU } });
      expect(set.find('.r-month__clear').exists()).toBe(true);
    });

    it('clears to undefined, not to an empty string', async () => {
      const wrapper = mount(MonthPicker, {
        props: { modelValue: '2026-08', clearable: true, locale: AU },
      });
      await wrapper.find('.r-month__clear').trigger('click');
      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([undefined]);
    });
  });
});
