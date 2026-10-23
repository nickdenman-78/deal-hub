import { mount } from '@vue/test-utils';
import { beforeAll, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { registerEtsIcons } from '../icons';
import ScheduleEditor from './ScheduleEditor.vue';

beforeAll(() => {
  registerEtsIcons();
});

function radios(wrapper: ReturnType<typeof mount>) {
  return wrapper.findAll('.r-schedule__body > .r-radios [role="radio"]');
}

describe('ScheduleEditor', () => {
  it('emits nothing on mount — an untouched editor is no choice at all', async () => {
    const wrapper = mount(ScheduleEditor, { props: { label: 'Schedule' } });
    await nextTick();
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  it('stamps the current minute as start when Now is selected', async () => {
    const wrapper = mount(ScheduleEditor, { props: { label: 'Schedule', modelValue: undefined } });

    // Move off Now, then back — selecting Now is the stamping act.
    await radios(wrapper)[1]!.trigger('click');
    await radios(wrapper)[0]!.trigger('click');

    const emitted = wrapper.emitted('update:modelValue')!.at(-1)![0] as { start: string };
    expect(emitted.start).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    expect(emitted).not.toHaveProperty('cron');
  });

  it('emits start alone for Later once a date-time is picked', async () => {
    const wrapper = mount(ScheduleEditor, { props: { label: 'Schedule' } });

    await radios(wrapper)[1]!.trigger('click');
    await wrapper.find('input[type="date"]').setValue('2026-09-01');
    await wrapper.find('input[type="time"]').setValue('08:30');
    await nextTick();

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([{ start: '2026-09-01T08:30' }]);
  });

  it('emits cron plus start for a weekly recurring schedule', async () => {
    const wrapper = mount(ScheduleEditor, { props: { label: 'Schedule' } });

    await radios(wrapper)[2]!.trigger('click');
    await wrapper.find('input[type="date"]').setValue('2026-09-01');
    await wrapper.find('input[type="time"]').setValue('08:30');
    await nextTick();

    // Default unit is weekly, seeded with one weekday — already complete.
    const emitted = wrapper.emitted('update:modelValue')!.at(-1)![0] as { start: string; cron: string };
    expect(emitted.start).toBe('2026-09-01T08:30');
    expect(emitted.cron).toMatch(/^30 8 \* \* \d$/);
  });

  it('reports the gap and emits undefined when all weekdays are deselected', async () => {
    const wrapper = mount(ScheduleEditor, {
      props: { label: 'Schedule', modelValue: { start: '2026-09-01T08:30', cron: '30 8 * * 2' } },
    });
    await nextTick();

    await wrapper.find('.r-toggles__item[aria-pressed="true"]').trigger('click');
    await nextTick();

    expect(wrapper.find('.r-schedule > .r-field__error').text()).toBe('Pick at least one day of the week.');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([undefined]);
  });

  it('opens a recognised cron with the recurrence controls set', async () => {
    const wrapper = mount(ScheduleEditor, {
      props: { label: 'Schedule', modelValue: { start: '2026-03-10T09:30', cron: '30 9 * * 1L' } },
    });
    await nextTick();

    // Monthly pane, "On a weekday", last + Monday.
    expect(radios(wrapper)[2]!.attributes('aria-checked')).toBe('true');
    const triggers = wrapper.findAll('.r-select__trigger').map((t) => t.text());
    expect(triggers).toContain('Month(s)');
    expect(triggers).toContain('last');
    expect(triggers).toContain('Monday');
    expect(wrapper.find('.r-schedule__foreign').exists()).toBe(false);
  });

  it('holds a foreign cron untouched behind a replace affordance', async () => {
    const wrapper = mount(ScheduleEditor, {
      props: { label: 'Schedule', modelValue: { start: '2026-03-10T09:30', cron: '0 9 LW * *' } },
    });
    await nextTick();

    const foreign = wrapper.find('.r-schedule__foreign');
    expect(foreign.exists()).toBe(true);
    // Described in prose; the raw expression is never shown to end users.
    expect(foreign.text()).toContain('last weekday of the month');
    expect(foreign.text()).not.toContain('LW');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();

    const replace = foreign.findAll('button').find((b) => b.text() === 'Replace schedule')!;
    await replace.trigger('click');
    await nextTick();
    expect(wrapper.find('.r-schedule__foreign').exists()).toBe(false);
  });

  /*
   * Popover OPEN/CLOSE cannot be asserted here (documented jsdom limitation);
   * these pin what the DOM shows while closed — an enabled, labelled trigger
   * beside the summary, with the run list rendered in the panel.
   */
  it('offers upcoming runs through the summary info popover', async () => {
    const wrapper = mount(ScheduleEditor, {
      props: { label: 'Schedule', modelValue: { start: '2026-03-10T09:30', cron: '30 9 * * 1-5' } },
    });
    await nextTick();

    const trigger = wrapper.find('.r-schedule__summary-row .r-popover__activator');
    expect(trigger.exists()).toBe(true);
    expect(trigger.attributes('disabled')).toBeUndefined();
    expect(trigger.attributes('aria-label')).toBe('Next runs');
    expect(wrapper.findAll('.r-schedule__occurrences li')).toHaveLength(5);
  });

  it('hides the info trigger when showOccurrences is off', async () => {
    const wrapper = mount(ScheduleEditor, {
      props: {
        label: 'Schedule',
        showOccurrences: false,
        modelValue: { start: '2026-03-10T09:30', cron: '30 9 * * 1-5' },
      },
    });
    await nextTick();

    expect(wrapper.find('.r-schedule__info').exists()).toBe(false);
  });

  it('alerts when a Later time is already in the past', async () => {
    const wrapper = mount(ScheduleEditor, {
      props: { label: 'Schedule', modelValue: { start: '2020-01-05T09:00' } },
    });
    await nextTick();

    const alert = wrapper.find('.r-schedule__no-runs');
    expect(alert.exists()).toBe(true);
    expect(alert.attributes('role')).toBe('alert');
    expect(alert.text()).toContain('in the past');
  });

  it('alerts when a recurring window closes before its next run', async () => {
    const wrapper = mount(ScheduleEditor, {
      props: {
        label: 'Schedule',
        modelValue: { start: '2020-01-06T09:00', cron: '0 9 * * 1-5', end: '2020-02-01' },
      },
    });
    await nextTick();

    const alert = wrapper.find('.r-schedule__no-runs');
    expect(alert.exists()).toBe(true);
    expect(alert.text()).toContain('no upcoming runs');
    // Nothing to promise: the next-runs info icon disappears with the runs.
    expect(wrapper.find('.r-schedule__info').exists()).toBe(false);
  });

  it('does not alert for live schedules, or for Now', async () => {
    const live = mount(ScheduleEditor, {
      props: { label: 'Schedule', modelValue: { start: '2020-01-06T09:00', cron: '0 9 * * 1-5' } },
    });
    await nextTick();
    expect(live.find('.r-schedule__no-runs').exists()).toBe(false);

    // Now's stamped minute means run-immediately — never a dead schedule.
    const now = mount(ScheduleEditor, { props: { label: 'Schedule' } });
    await radios(now)[1]!.trigger('click');
    await radios(now)[0]!.trigger('click');
    expect(now.find('.r-schedule__no-runs').exists()).toBe(false);
  });

  it('renders prose only when readonly', async () => {
    const wrapper = mount(ScheduleEditor, {
      props: {
        label: 'Schedule',
        readonly: true,
        modelValue: { start: '2026-03-10T09:30', cron: '30 9 * * 1-5' },
      },
    });
    await nextTick();

    expect(wrapper.find('.r-schedule__summary--readonly').text()).toContain('Monday through Friday');
    expect(wrapper.find('[role="radio"]').exists()).toBe(false);
  });
});
