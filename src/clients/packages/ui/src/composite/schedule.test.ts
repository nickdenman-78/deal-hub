import { describe, expect, it } from 'vitest';
import { isValidCron } from '../components/cron';
import {
  buildScheduleCron,
  defaultDraft,
  describeSchedule,
  detectRecurrence,
  draftToValue,
  occurrencesBetween,
  scheduleNeverRuns,
  scheduleProblem,
  scheduleValuesEqual,
  toLocalDateTime,
  valueToDraft,
  type ScheduleDraft,
} from './schedule';

const NOW = new Date(2026, 7, 11, 14, 30); // Tue 11 Aug 2026, 14:30 local

function recurring(overrides: Partial<ScheduleDraft> = {}): ScheduleDraft {
  return { ...defaultDraft(NOW), mode: 'recurring', start: '2026-03-10T09:30', ...overrides };
}

describe('toLocalDateTime', () => {
  it('formats local wall-clock minutes', () => {
    expect(toLocalDateTime(NOW)).toBe('2026-08-11T14:30');
    expect(toLocalDateTime(new Date(2026, 0, 5, 8, 5))).toBe('2026-01-05T08:05');
  });
});

describe('buildScheduleCron', () => {
  it('builds each recurrence unit from the start time of day', () => {
    expect(buildScheduleCron(recurring({ unit: 'hour', hourInterval: 1 }))).toBe('30 * * * *');
    expect(buildScheduleCron(recurring({ unit: 'hour', hourInterval: 4 }))).toBe('30 */4 * * *');
    expect(buildScheduleCron(recurring({ unit: 'day' }))).toBe('30 9 * * *');
    expect(buildScheduleCron(recurring({ unit: 'week', weekdays: [1, 3, 5] }))).toBe('30 9 * * 1,3,5');
    expect(buildScheduleCron(recurring({ unit: 'week', weekdays: [1, 2, 3, 4, 5] }))).toBe('30 9 * * 1-5');
    expect(buildScheduleCron(recurring({ unit: 'month', dayOfMonth: 15 }))).toBe('30 9 15 * *');
    expect(buildScheduleCron(recurring({ unit: 'month', dayOfMonth: 'L' }))).toBe('30 9 L * *');
  });

  it('anchors month intervals at the start month', () => {
    expect(buildScheduleCron(recurring({ unit: 'month', dayOfMonth: 15, monthInterval: 3 }))).toBe(
      '30 9 15 3,6,9,12 *',
    );
    // Start in August: the list wraps the year and sorts ascending.
    expect(
      buildScheduleCron(recurring({ start: '2026-08-11T09:30', unit: 'month', dayOfMonth: 1, monthInterval: 6 })),
    ).toBe('30 9 1 2,8 *');
    expect(
      buildScheduleCron(recurring({ start: '2026-08-11T09:30', unit: 'month', dayOfMonth: 1, monthInterval: 12 })),
    ).toBe('30 9 1 8 *');
  });

  it('builds first/last weekday-of-month as day-of-week specials', () => {
    expect(
      buildScheduleCron(recurring({ unit: 'month', monthlyStyle: 'nthWeekday', nthWeek: 'first', nthWeekday: 1 })),
    ).toBe('30 9 * * 1#1');
    expect(
      buildScheduleCron(recurring({ unit: 'month', monthlyStyle: 'nthWeekday', nthWeek: 'last', nthWeekday: 5 })),
    ).toBe('30 9 * * 5L');
    expect(
      buildScheduleCron(
        recurring({
          unit: 'month',
          monthlyStyle: 'nthWeekday',
          nthWeek: 'first',
          nthWeekday: 3,
          monthInterval: 3,
        }),
      ),
    ).toBe('30 9 * 3,6,9,12 3#1');
  });

  it('collapses all seven weekdays to every day', () => {
    expect(buildScheduleCron(recurring({ unit: 'week', weekdays: [0, 1, 2, 3, 4, 5, 6] }))).toBe('30 9 * * *');
  });

  it('is null while the draft cannot produce an expression', () => {
    expect(buildScheduleCron(recurring({ start: undefined }))).toBeNull();
    expect(buildScheduleCron(recurring({ unit: 'week', weekdays: [] }))).toBeNull();
  });

  /*
   * The dialect contract: everything the builder can emit must parse in
   * Cronos, Croner and cronstrue alike. Five fields, no `?`/`W`/`#L`/names/7,
   * and never day-of-month and day-of-week restricted together (Vixie OR).
   */
  it('stays inside the Cronos-safe dialect for every shape', () => {
    const drafts: ScheduleDraft[] = [
      recurring({ unit: 'hour', hourInterval: 1 }),
      recurring({ unit: 'hour', hourInterval: 12 }),
      recurring({ unit: 'day' }),
      recurring({ unit: 'week', weekdays: [0] }),
      recurring({ unit: 'week', weekdays: [7] }),
      recurring({ unit: 'week', weekdays: [0, 6] }),
      recurring({ unit: 'week', weekdays: [1, 2, 3, 4, 5] }),
      recurring({ unit: 'month', dayOfMonth: 31 }),
      recurring({ unit: 'month', dayOfMonth: 'L', monthInterval: 2 }),
      recurring({ unit: 'month', monthlyStyle: 'nthWeekday', nthWeek: 'first', nthWeekday: 0 }),
      recurring({ unit: 'month', monthlyStyle: 'nthWeekday', nthWeek: 'last', nthWeekday: 7 }),
      recurring({ unit: 'month', monthlyStyle: 'nthWeekday', nthWeek: 'last', nthWeekday: 6, monthInterval: 4 }),
    ];

    for (const candidate of drafts) {
      const expr = buildScheduleCron(candidate);
      expect(expr).not.toBeNull();
      expect(isValidCron(expr!)).toBe(true);

      const fields = expr!.split(' ');
      expect(fields).toHaveLength(5);
      expect(expr).not.toMatch(/[?W]/i);
      expect(expr).not.toMatch(/#L/i);
      expect(fields[4]).not.toMatch(/7/);
      // Vixie OR guard: at most one of day-of-month / day-of-week restricted.
      expect(fields[2] === '*' || fields[4] === '*').toBe(true);
    }
  });
});

describe('detectRecurrence', () => {
  it('round-trips every shape the builder emits', () => {
    const drafts: ScheduleDraft[] = [
      recurring({ unit: 'hour', hourInterval: 1 }),
      recurring({ unit: 'hour', hourInterval: 6 }),
      recurring({ unit: 'day' }),
      recurring({ unit: 'week', weekdays: [1, 3, 5] }),
      recurring({ unit: 'month', dayOfMonth: 15 }),
      recurring({ unit: 'month', dayOfMonth: 'L' }),
      recurring({ unit: 'month', dayOfMonth: 15, monthInterval: 3 }),
      recurring({ unit: 'month', monthlyStyle: 'nthWeekday', nthWeek: 'first', nthWeekday: 1 }),
      recurring({ unit: 'month', monthlyStyle: 'nthWeekday', nthWeek: 'last', nthWeekday: 5 }),
    ];

    for (const original of drafts) {
      const expr = buildScheduleCron(original)!;
      const detected = detectRecurrence(expr);
      expect(detected).not.toBeNull();
      expect(buildScheduleCron({ ...original, ...detected! })).toBe(expr);
    }
  });

  it('normalises 7 to 0 in weekday lists and specials', () => {
    expect(detectRecurrence('30 9 * * 7')).toMatchObject({ unit: 'week', weekdays: [0] });
    expect(detectRecurrence('30 9 * * 7L')).toMatchObject({
      unit: 'month',
      monthlyStyle: 'nthWeekday',
      nthWeek: 'last',
      nthWeekday: 0,
    });
  });

  it('is null for anything the controls cannot round-trip', () => {
    expect(detectRecurrence('*/2 * * * *')).toBeNull(); // stepped minutes
    expect(detectRecurrence('30 */5 * * *')).toBeNull(); // 5 does not divide 24
    expect(detectRecurrence('0 9 1 * 1')).toBeNull(); // dom+dow (Vixie OR trap)
    expect(detectRecurrence('0 9 * * 1#2')).toBeNull(); // only first/last supported
    expect(detectRecurrence('0 9 * * 1#L')).toBeNull(); // invalid everywhere
    expect(detectRecurrence('0 9 LW * *')).toBeNull(); // dom special not offered
    expect(detectRecurrence('0 9 * 2,5 *')).toBeNull(); // unevenly spaced months
    expect(detectRecurrence('0 9 * 6-8 1')).toBeNull(); // weekly with month filter
    expect(detectRecurrence('0 0 9 * * 1')).toBeNull(); // six-field
    expect(detectRecurrence('nonsense')).toBeNull();
  });
});

describe('scheduleProblem', () => {
  it('is silent for now, and for foreign schedules', () => {
    expect(scheduleProblem({ ...defaultDraft(NOW), mode: 'now' })).toBeNull();
    expect(scheduleProblem(recurring({ start: undefined, foreign: { cron: '0 9 LW * *' } }))).toBeNull();
  });

  it('requires a start for once and recurring', () => {
    expect(scheduleProblem({ ...defaultDraft(NOW), mode: 'once' })).toBe('Pick a date and time.');
    expect(scheduleProblem(recurring({ start: undefined }))).toBe('Pick a start date and time.');
  });

  it('requires at least one weekday for weekly', () => {
    expect(scheduleProblem(recurring({ unit: 'week', weekdays: [] }))).toBe('Pick at least one day of the week.');
  });

  it('requires a coherent end date when one is asked for', () => {
    expect(scheduleProblem(recurring({ hasEnd: true }))).toBe('Pick an end date.');
    expect(scheduleProblem(recurring({ hasEnd: true, end: '2026-03-09' }))).toBe('The end date is before the start.');
    expect(scheduleProblem(recurring({ hasEnd: true, end: '2026-03-10' }))).toBeNull();
  });
});

describe('draftToValue', () => {
  it('emits start alone for now and once', () => {
    expect(draftToValue({ ...defaultDraft(NOW), mode: 'now', start: '2026-08-11T14:30' })).toEqual({
      start: '2026-08-11T14:30',
    });
    expect(draftToValue({ ...defaultDraft(NOW), mode: 'once', start: '2026-09-01T08:00' })).toEqual({
      start: '2026-09-01T08:00',
    });
  });

  it('is undefined while the draft is incomplete', () => {
    expect(draftToValue({ ...defaultDraft(NOW), mode: 'once' })).toBeUndefined();
    expect(draftToValue(recurring({ start: undefined }))).toBeUndefined();
    expect(draftToValue(recurring({ unit: 'week', weekdays: [] }))).toBeUndefined();
    expect(draftToValue(recurring({ hasEnd: true }))).toBeUndefined();
  });

  it('emits cron plus window for recurring', () => {
    expect(draftToValue(recurring({ unit: 'week', weekdays: [1, 3] }))).toEqual({
      start: '2026-03-10T09:30',
      cron: '30 9 * * 1,3',
    });
    expect(draftToValue(recurring({ unit: 'day', hasEnd: true, end: '2026-12-31' }))).toEqual({
      start: '2026-03-10T09:30',
      cron: '30 9 * * *',
      end: '2026-12-31',
    });
  });

  it('passes a foreign schedule through untouched', () => {
    const foreign = { start: '2026-03-10T09:30', cron: '0 9 LW * *', end: '2027-01-01' };
    expect(draftToValue(recurring({ foreign }))).toEqual(foreign);
  });
});

describe('valueToDraft', () => {
  it('resets to the default draft for an empty value', () => {
    expect(valueToDraft(undefined).mode).toBe('now');
    expect(valueToDraft({}).mode).toBe('now');
  });

  it('reads a bare start as once, unless the previous draft says now', () => {
    expect(valueToDraft({ start: '2026-08-11T14:30' }).mode).toBe('once');

    const previous = { ...defaultDraft(NOW), mode: 'now' as const, start: '2026-08-11T14:30' };
    expect(valueToDraft({ start: '2026-08-11T14:30' }, previous).mode).toBe('now');
    expect(valueToDraft({ start: '2026-08-12T00:00' }, previous).mode).toBe('once');
  });

  it('opens a recognised cron with the recurrence controls set', () => {
    const draft = valueToDraft({ start: '2026-03-10T09:30', cron: '30 9 * * 1,3,5', end: '2026-12-31' });
    expect(draft).toMatchObject({
      mode: 'recurring',
      unit: 'week',
      weekdays: [1, 3, 5],
      hasEnd: true,
      end: '2026-12-31',
      foreign: undefined,
    });
  });

  it('marks a cron it cannot round-trip as foreign rather than approximating', () => {
    // Valid, recognisable pattern — but the month list is anchored at January
    // while the start is in March, so rebuilding would rewrite it.
    const reanchored = valueToDraft({ start: '2026-03-10T09:30', cron: '30 9 15 1,4,7,10 *' });
    expect(reanchored.foreign).toEqual({ start: '2026-03-10T09:30', cron: '30 9 15 1,4,7,10 *' });

    const unknown = valueToDraft({ start: '2026-03-10T09:30', cron: '0 9 LW * *' });
    expect(unknown.mode).toBe('recurring');
    expect(unknown.foreign).toEqual({ start: '2026-03-10T09:30', cron: '0 9 LW * *' });

    // A different minute than the start time also refuses to round-trip.
    const offMinute = valueToDraft({ start: '2026-03-10T09:30', cron: '0 9 * * *' });
    expect(offMinute.foreign).toBeDefined();

    // No start at all: our editor always writes one, so this came from elsewhere.
    const noStart = valueToDraft({ cron: '30 9 * * *' });
    expect(noStart.foreign).toEqual({ cron: '30 9 * * *' });
  });
});

describe('describeSchedule', () => {
  it('describes a once-off as a single date', () => {
    const text = describeSchedule({ start: '2026-08-11T14:30' });
    expect(text).toContain('Once, on ');
    expect(text).toContain('2026');
  });

  it('describes a recurring schedule with its window', () => {
    const text = describeSchedule({ start: '2026-03-10T09:30', cron: '30 9 * * 1-5', end: '2026-12-31' });
    expect(text).toContain('At 09:30, Monday through Friday');
    expect(text).toContain('from ');
    expect(text).toContain('until ');
  });

  it('is empty for no value', () => {
    expect(describeSchedule(undefined)).toBe('');
    expect(describeSchedule({})).toBe('');
  });
});

describe('occurrencesBetween', () => {
  const from = new Date(2026, 7, 10, 12, 0); // Mon 10 Aug 2026, noon

  it('starts no earlier than the schedule start', () => {
    const runs = occurrencesBetween('0 9 * * 1-5', '2026-08-20T09:00', undefined, 5, from);
    expect(runs).toHaveLength(5);
    // Thu 20 Aug 09:00 is the first run — the start instant itself counts.
    expect(runs[0]!.getTime()).toBe(new Date(2026, 7, 20, 9, 0).getTime());
  });

  it('stops at the end of the end day', () => {
    const runs = occurrencesBetween('0 9 * * 1-5', '2026-08-20T09:00', '2026-08-21', 5, from);
    expect(runs.map((run) => run.getDate())).toEqual([20, 21]);
  });

  it('ignores a start already in the past', () => {
    const runs = occurrencesBetween('0 9 * * *', '2026-01-01T00:00', undefined, 2, from);
    expect(runs[0]!.getTime()).toBe(new Date(2026, 7, 11, 9, 0).getTime());
  });
});

describe('scheduleNeverRuns', () => {
  const from = new Date(2026, 7, 10, 12, 0); // Mon 10 Aug 2026, noon (minute-floored)

  it('flags a once-off whose date-time has passed', () => {
    expect(scheduleNeverRuns({ start: '2026-08-10T11:59' }, from)).toBe(true);
    expect(scheduleNeverRuns({ start: '2020-01-01T09:00' }, from)).toBe(true);
  });

  it('accepts a once-off in the current minute or later', () => {
    expect(scheduleNeverRuns({ start: '2026-08-10T12:00' }, from)).toBe(false);
    expect(scheduleNeverRuns({ start: '2026-08-10T12:01' }, from)).toBe(false);
    expect(scheduleNeverRuns({ start: '2027-01-01T00:00' }, from)).toBe(false);
  });

  it('flags a recurring window that closes before the next run', () => {
    // Expired outright.
    expect(scheduleNeverRuns({ start: '2026-01-05T09:00', cron: '0 9 * * 1-5', end: '2026-02-01' }, from)).toBe(true);
    // Window entirely in the future, but shut before the first fire: weekday
    // runs cannot land on Sat 15 / Sun 16 Aug.
    expect(scheduleNeverRuns({ start: '2026-08-15T09:00', cron: '0 9 * * 1-5', end: '2026-08-16' }, from)).toBe(true);
  });

  it('accepts a recurring schedule with a reachable run', () => {
    expect(scheduleNeverRuns({ start: '2026-01-05T09:00', cron: '0 9 * * 1-5' }, from)).toBe(false);
    // Tue 11 Aug 09:00 is the next run and the end day still admits it.
    expect(scheduleNeverRuns({ start: '2026-01-05T09:00', cron: '0 9 * * 1-5', end: '2026-08-11' }, from)).toBe(false);
    // The end day itself: today's 09:00 fired before `from`, so nothing remains.
    expect(scheduleNeverRuns({ start: '2026-01-05T09:00', cron: '0 9 * * 1-5', end: '2026-08-10' }, from)).toBe(true);
  });

  it('says nothing about absent, incomplete or invalid values', () => {
    expect(scheduleNeverRuns(undefined, from)).toBe(false);
    expect(scheduleNeverRuns({}, from)).toBe(false);
    expect(scheduleNeverRuns({ end: '2020-01-01' }, from)).toBe(false);
    expect(scheduleNeverRuns({ cron: 'nonsense' }, from)).toBe(false);
  });
});

describe('scheduleValuesEqual', () => {
  it('compares property-wise with undefined as empty', () => {
    expect(scheduleValuesEqual(undefined, undefined)).toBe(true);
    expect(scheduleValuesEqual(undefined, {})).toBe(true);
    expect(scheduleValuesEqual({ start: 'a' }, { start: 'a' })).toBe(true);
    expect(scheduleValuesEqual({ start: 'a' }, { start: 'b' })).toBe(false);
    expect(scheduleValuesEqual({ start: 'a', cron: 'c' }, { start: 'a' })).toBe(false);
  });
});
