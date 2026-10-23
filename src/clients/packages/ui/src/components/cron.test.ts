import { describe, expect, it } from 'vitest';
import {
  buildCron,
  cronError,
  describeCron,
  detectShape,
  formatSimpleList,
  isValidCron,
  joinCron,
  nextOccurrences,
  normalizeMonths,
  parseSimpleList,
  splitCron,
} from './cron';

describe('splitCron', () => {
  it('splits five fields on any run of whitespace', () => {
    expect(splitCron('  0   9 * *   1  ')).toEqual({
      second: '',
      minute: '0',
      hour: '9',
      dayOfMonth: '*',
      month: '*',
      dayOfWeek: '1',
    });
  });

  it('splits six fields with a leading seconds value', () => {
    expect(splitCron('*/10 0 9 * * 1')).toEqual({
      second: '*/10',
      minute: '0',
      hour: '9',
      dayOfMonth: '*',
      month: '*',
      dayOfWeek: '1',
    });
  });

  it('is null for anything that is not five or six fields', () => {
    expect(splitCron('* * * *')).toBeNull();
    expect(splitCron('0 0 0 9 * * 1')).toBeNull();
    expect(splitCron('')).toBeNull();
    expect(splitCron(null)).toBeNull();
  });
});

describe('joinCron', () => {
  it('joins five fields and fills blanks with star', () => {
    expect(
      joinCron({
        second: '',
        minute: '0',
        hour: '9',
        dayOfMonth: '',
        month: '*',
        dayOfWeek: '1-5',
      }),
    ).toBe('0 9 * * 1-5');
  });

  it('prefixes seconds when present', () => {
    expect(
      joinCron({
        second: '0',
        minute: '0',
        hour: '9',
        dayOfMonth: '*',
        month: '*',
        dayOfWeek: '*',
      }),
    ).toBe('0 0 9 * * *');
  });
});

describe('cronError', () => {
  it('accepts the syntax forms', () => {
    expect(isValidCron('* * * * *')).toBe(true);
    expect(isValidCron('*/15 * * * *')).toBe(true);
    expect(isValidCron('0,30 9-17 * * 1-5')).toBe(true);
    expect(isValidCron('0 0-23/2 1,15 * *')).toBe(true);
  });

  it('accepts 7 as Sunday, which a working crontab may already contain', () => {
    expect(isValidCron('0 9 * * 7')).toBe(true);
  });

  it('names the offending field', () => {
    expect(cronError('60 * * * *')).toContain('minute');
    expect(cronError('0 24 * * *')).toContain('hour');
    expect(cronError('0 0 32 * *')).toContain('day-of-month');
    expect(cronError('0 0 * 13 *')).toContain('month');
    expect(cronError('0 0 * * 8')).toContain('day-of-week');
  });

  it('accepts Cronos day-of-month specials the backend runs', () => {
    expect(isValidCron('0 9 L * *')).toBe(true);
    expect(isValidCron('0 9 LW * *')).toBe(true);
    expect(isValidCron('0 9 L-1 * *')).toBe(true);
    expect(isValidCron('0 9 L-2 * *')).toBe(true);
    expect(isValidCron('0 9 15W * *')).toBe(true);
    expect(isValidCron('0 9 1W * *')).toBe(true);
    expect(isValidCron('0 9 L-5W * *')).toBe(true);
  });

  it('rejects day-of-month specials mixed into lists, which Cronos also rejects', () => {
    expect(isValidCron('0 9 15,L * *')).toBe(false);
    expect(isValidCron('0 9 L,15 * *')).toBe(false);
  });

  it('accepts day-of-week specials shared by Cronos and Croner', () => {
    expect(isValidCron('0 9 * * 1L')).toBe(true);
    expect(isValidCron('0 9 * * 5l')).toBe(true);
    expect(isValidCron('0 9 * * 0L')).toBe(true);
    expect(isValidCron('0 9 * * 1#1')).toBe(true);
    expect(isValidCron('0 9 * * 7#3')).toBe(true);
    expect(isValidCron('0 9 * * 5#5')).toBe(true);
  });

  it('rejects day-of-week special forms outside the shared dialect', () => {
    expect(isValidCron('0 9 * * 1#6')).toBe(false);
    expect(isValidCron('0 9 * * 1#0')).toBe(false);
    expect(isValidCron('0 9 * * #1')).toBe(false);
    // `1#L` parses in Croner but cronstrue renders it as "the null Monday".
    expect(isValidCron('0 9 * * 1#L')).toBe(false);
    expect(isValidCron('0 9 * * 8L')).toBe(false);
    expect(isValidCron('0 9 * * 1,2#1')).toBe(false);
    expect(isValidCron('0 9 * * 1L,5L')).toBe(false);
  });

  it('rejects a zero step rather than guessing what it means', () => {
    expect(isValidCron('*/0 * * * *')).toBe(false);
  });

  it('rejects malformed terms', () => {
    expect(isValidCron('0 * * * ')).toBe(false);
    expect(isValidCron('0,, * * * *')).toBe(false);
    expect(isValidCron('1-2-3 * * * *')).toBe(false);
    expect(isValidCron('a * * * *')).toBe(false);
    expect(isValidCron('*/2/3 * * * *')).toBe(false);
  });

  it('accepts a leading seconds field', () => {
    expect(isValidCron('0 0 9 * * 1')).toBe(true);
    expect(isValidCron('*/10 * * * * *')).toBe(true);
    expect(isValidCron('60 0 9 * * *')).toBe(false);
  });

  it('explains the shape when the field count is wrong', () => {
    expect(cronError('* * *')).toContain('five fields');
  });
});

describe('parseSimpleList / formatSimpleList', () => {
  it('parses singles, ranges and comma lists', () => {
    expect(parseSimpleList('3', 0, 6)).toEqual([3]);
    expect(parseSimpleList('1-5', 0, 6)).toEqual([1, 2, 3, 4, 5]);
    expect(parseSimpleList('1,3,5', 0, 6)).toEqual([1, 3, 5]);
    expect(parseSimpleList('1-3,5,6', 0, 6)).toEqual([1, 2, 3, 5, 6]);
  });

  it('rejects star, steps and inverted ranges', () => {
    expect(parseSimpleList('*', 1, 12)).toBeNull();
    expect(parseSimpleList('1-5/2', 1, 12)).toBeNull();
    expect(parseSimpleList('5-1', 1, 12)).toBeNull();
    expect(parseSimpleList('13', 1, 12)).toBeNull();
  });

  it('compacts consecutive values into ranges', () => {
    expect(formatSimpleList([1, 2, 3, 4, 5])).toBe('1-5');
    expect(formatSimpleList([1, 3, 5])).toBe('1,3,5');
    expect(formatSimpleList([1, 2, 3, 5, 7, 8])).toBe('1-3,5,7-8');
    expect(formatSimpleList([])).toBe('*');
  });

  it('treats all twelve months as every month', () => {
    expect(normalizeMonths([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])).toEqual([]);
    expect(normalizeMonths([1, 6, 12])).toEqual([1, 6, 12]);
  });
});

describe('detectShape', () => {
  it('recognises each preset', () => {
    expect(detectShape('* * * * *').preset).toBe('minutely');
    expect(detectShape('5 * * * *')).toMatchObject({ preset: 'hourly', minute: 5 });
    expect(detectShape('30 2 * * *')).toMatchObject({
      preset: 'daily',
      minute: 30,
      hour: 2,
      months: [],
      daysOfWeek: [],
    });
    expect(detectShape('0 9 * * 1')).toMatchObject({
      preset: 'weekly',
      minute: 0,
      hour: 9,
      daysOfWeek: [1],
      months: [],
    });
    expect(detectShape('0 3 15 * *')).toMatchObject({
      preset: 'monthly',
      minute: 0,
      hour: 3,
      dayOfMonth: 15,
      months: [],
    });
  });

  it('normalises 7 to 0 so the weekday control has one Sunday, not two', () => {
    expect(detectShape('0 9 * * 7')).toMatchObject({ preset: 'weekly', daysOfWeek: [0] });
    expect(detectShape('0 9 * * 0')).toMatchObject({ preset: 'weekly', daysOfWeek: [0] });
  });

  it('recognises multiple weekdays and weekday ranges as weekly', () => {
    expect(detectShape('0 9 * * 1-5')).toMatchObject({
      preset: 'weekly',
      daysOfWeek: [1, 2, 3, 4, 5],
    });
    expect(detectShape('0 9 * * 1,3,5')).toMatchObject({
      preset: 'weekly',
      daysOfWeek: [1, 3, 5],
    });
    expect(detectShape('30 8 * * 1-3,5')).toMatchObject({
      preset: 'weekly',
      daysOfWeek: [1, 2, 3, 5],
    });
  });

  it('recognises month lists and ranges on daily, weekly and monthly', () => {
    expect(detectShape('0 9 * 1,6,12 *')).toMatchObject({
      preset: 'daily',
      months: [1, 6, 12],
    });
    expect(detectShape('0 9 * 6-8 1')).toMatchObject({
      preset: 'weekly',
      daysOfWeek: [1],
      months: [6, 7, 8],
    });
    expect(detectShape('0 3 15 1-3 *')).toMatchObject({
      preset: 'monthly',
      dayOfMonth: 15,
      months: [1, 2, 3],
    });
  });

  it('collapses all seven weekdays to daily / every day', () => {
    expect(detectShape('0 9 * * 0-6')).toMatchObject({ preset: 'daily', daysOfWeek: [] });
    expect(detectShape('0 9 * * 0,1,2,3,4,5,6')).toMatchObject({ preset: 'daily', daysOfWeek: [] });
  });

  it('recognises Cronos day-of-month specials as monthly', () => {
    expect(detectShape('0 9 L * *')).toMatchObject({ preset: 'monthly', dayOfMonth: 'L' });
    expect(detectShape('0 9 LW * *')).toMatchObject({ preset: 'monthly', dayOfMonth: 'LW' });
    expect(detectShape('0 9 L-1 * *')).toMatchObject({ preset: 'monthly', dayOfMonth: 'L-1' });
    expect(detectShape('0 9 15W * *')).toMatchObject({ preset: 'monthly', dayOfMonth: '15W' });
    expect(detectShape('0 9 L 6-8 *')).toMatchObject({
      preset: 'monthly',
      dayOfMonth: 'L',
      months: [6, 7, 8],
    });
  });

  /*
   * The load-bearing case. Anything the controls cannot round-trip must fall to
   * custom, or selecting an unrelated control would silently rewrite the
   * operator's expression into an approximation of it.
   */
  it('falls to custom for anything a preset would only approximate', () => {
    expect(detectShape('*/15 * * * *').preset).toBe('custom');
    expect(detectShape('0,30 9 * * *').preset).toBe('custom');
    expect(detectShape('0 9 * */2 *').preset).toBe('custom');
    expect(detectShape('0 9 * * 1-5/2').preset).toBe('custom');
  });

  it('falls to custom for day-of-week specials, which no preset round-trips', () => {
    expect(detectShape('0 9 * * 1L').preset).toBe('custom');
    expect(detectShape('0 9 * * 1#1').preset).toBe('custom');
  });

  it('treats six-field with second 0 as the matching five-field preset', () => {
    expect(detectShape('0 0 9 * * 1')).toMatchObject({
      preset: 'weekly',
      daysOfWeek: [1],
    });
  });

  it('falls to custom when seconds are more than on-the-second', () => {
    expect(detectShape('*/5 0 9 * * *').preset).toBe('custom');
    expect(detectShape('* * * * * *').preset).toBe('custom');
  });

  it('falls to custom for invalid input instead of throwing', () => {
    expect(detectShape('nonsense').preset).toBe('custom');
    expect(detectShape('61 * * * *').preset).toBe('custom');
    expect(detectShape(undefined).preset).toBe('custom');
  });
});

describe('buildCron', () => {
  const base = {
    minute: 30,
    hour: 9,
    daysOfWeek: [3],
    dayOfMonth: 15,
    months: [] as number[],
  };

  it('builds each preset', () => {
    expect(buildCron({ ...base, preset: 'minutely' })).toBe('* * * * *');
    expect(buildCron({ ...base, preset: 'hourly' })).toBe('30 * * * *');
    expect(buildCron({ ...base, preset: 'daily' })).toBe('30 9 * * *');
    expect(buildCron({ ...base, preset: 'weekly' })).toBe('30 9 * * 3');
    expect(buildCron({ ...base, preset: 'monthly' })).toBe('30 9 15 * *');
  });

  it('compacts weekday and month selections into ranges', () => {
    expect(
      buildCron({
        ...base,
        preset: 'weekly',
        daysOfWeek: [1, 2, 3, 4, 5],
        months: [6, 7, 8],
      }),
    ).toBe('30 9 * 6-8 1-5');

    expect(
      buildCron({
        ...base,
        preset: 'monthly',
        months: [1, 3, 12],
      }),
    ).toBe('30 9 15 1,3,12 *');
  });

  it('builds day-of-month specials', () => {
    expect(buildCron({ ...base, preset: 'monthly', dayOfMonth: 'L' })).toBe('30 9 L * *');
    expect(buildCron({ ...base, preset: 'monthly', dayOfMonth: 'LW' })).toBe('30 9 LW * *');
    expect(buildCron({ ...base, preset: 'monthly', dayOfMonth: 'L-1' })).toBe('30 9 L-1 * *');
    expect(buildCron({ ...base, preset: 'monthly', dayOfMonth: '15W' })).toBe('30 9 15W * *');
  });

  it('round-trips every preset through detectShape', () => {
    for (const preset of ['minutely', 'hourly', 'daily', 'weekly', 'monthly'] as const) {
      const expr = buildCron({ ...base, preset });
      expect(detectShape(expr).preset).toBe(preset);
    }
  });

  it('round-trips multi-day and multi-month selections', () => {
    const expr = buildCron({
      ...base,
      preset: 'weekly',
      daysOfWeek: [1, 2, 3, 5],
      months: [1, 2, 3, 10],
    });
    expect(expr).toBe('30 9 * 1-3,10 1-3,5');
    expect(detectShape(expr)).toMatchObject({
      preset: 'weekly',
      daysOfWeek: [1, 2, 3, 5],
      months: [1, 2, 3, 10],
    });
  });
});

describe('describeCron', () => {
  it('describes common schedules in prose', () => {
    expect(describeCron('* * * * *')).toBe('Every minute, every hour, every day.');
    expect(describeCron('5 * * * *')).toBe('At 5 minutes past the hour, every hour, every day.');
    expect(describeCron('30 2 * * *')).toBe('At 02:30, every day.');
    expect(describeCron('0 9 * * 1')).toBe('At 09:00, only on Monday.');
    expect(describeCron('0 3 15 * *')).toBe('At 03:00, on day 15 of the month.');
  });

  it('describes weekday ranges and lists', () => {
    expect(describeCron('0 9 * * 1-5')).toBe('At 09:00, Monday through Friday.');
    expect(describeCron('0 9 * * 1,3,5')).toBe('At 09:00, only on Monday, Wednesday, and Friday.');
  });

  it('describes day-of-week specials in prose', () => {
    expect(describeCron('0 9 * * 1L')).toBe('At 09:00, on the last Monday of the month.');
    expect(describeCron('0 9 * * 1#1')).toBe('At 09:00, on the first Monday of the month.');
    expect(describeCron('0 9 * * 5#3')).toBe('At 09:00, on the third Friday of the month.');
  });

  it('describes month restrictions and day-of-month specials', () => {
    expect(describeCron('0 9 * 6-8 *')).toBe('At 09:00, every day, June through August.');
    expect(describeCron('0 9 L * *')).toBe('At 09:00, on the last day of the month.');
    expect(describeCron('0 9 LW * *')).toBe('At 09:00, on the last weekday of the month.');
    expect(describeCron('*/15 9-17 * * 1-5')).toBe('Every 15 minutes, between 09:00 and 17:59, Monday through Friday.');
  });

  it('describes six-field expressions with seconds', () => {
    expect(describeCron('*/10 * * * * *')).toBe('Every 10 seconds, every minute, every hour, every day.');
  });

  it('says nothing at all when the expression is invalid', () => {
    expect(describeCron('61 * * * *')).toBe('');
    expect(describeCron('nope')).toBe('');
  });
});

describe('nextOccurrences', () => {
  const from = new Date('2026-08-10T12:00:00.000Z');

  it('returns the next N fire times for a weekday schedule', () => {
    const runs = nextOccurrences('0 9 * * 1-5', 5, from);
    expect(runs).toHaveLength(5);
    for (let i = 0; i < runs.length; i++) {
      const when = runs[i]!;
      expect(when.getHours()).toBe(9);
      expect(when.getMinutes()).toBe(0);
      expect([1, 2, 3, 4, 5]).toContain(when.getDay());
      if (i > 0) expect(when.getTime()).toBeGreaterThan(runs[i - 1]!.getTime());
    }
  });

  it('handles six-field expressions with seconds', () => {
    const start = new Date('2026-08-10T12:28:05.000Z');
    const runs = nextOccurrences('*/10 * * * * *', 3, start);
    expect(runs.map((d) => d.toISOString())).toEqual([
      '2026-08-10T12:28:10.000Z',
      '2026-08-10T12:28:20.000Z',
      '2026-08-10T12:28:30.000Z',
    ]);
  });

  it('is empty for invalid expressions', () => {
    expect(nextOccurrences('61 * * * *', 5, from)).toEqual([]);
    expect(nextOccurrences('nope', 5, from)).toEqual([]);
    expect(nextOccurrences('', 5, from)).toEqual([]);
  });
});
