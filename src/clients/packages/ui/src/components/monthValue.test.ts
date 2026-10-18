import { describe, expect, it } from 'vitest';
import {
  compareMonth,
  formatMonth,
  isMonthOutOfRange,
  monthLabel,
  monthName,
  monthOfDate,
  monthOrdinal,
  parseMonth,
  shiftMonth,
} from './monthValue';

/*
 * The locale is pinned on every label assertion. Leaving it to the host makes
 * the suite pass or fail on which machine runs it, which is worse than not
 * testing the labels at all.
 */
const AU = 'en-AU';

describe('parseMonth', () => {
  it('reads a yyyy-MM string', () => {
    expect(parseMonth('2026-08')).toEqual({ year: 2026, month: 8 });
  });

  it('reads month as 1-12, not the 0-based month of Date', () => {
    // The single most likely way to be a month out everywhere at once.
    expect(parseMonth('2026-01')?.month).toBe(1);
    expect(parseMonth('2026-12')?.month).toBe(12);
  });

  it.each([
    ['2026-13', 'a month that does not exist'],
    ['2026-00', 'month zero'],
    ['2026-8', 'an unpadded month'],
    ['26-08', 'a two-digit year'],
    ['2026/08', 'the wrong separator'],
    ['2026-08-01', 'a full date'],
    ['', 'empty'],
  ])('rejects %s (%s)', (value) => {
    expect(parseMonth(value)).toBeNull();
  });

  it('treats null and undefined as absent rather than throwing', () => {
    expect(parseMonth(null)).toBeNull();
    expect(parseMonth(undefined)).toBeNull();
  });
});

describe('formatMonth', () => {
  it('pads the month, so the value is always comparable as a string', () => {
    expect(formatMonth({ year: 2026, month: 8 })).toBe('2026-08');
  });

  it('round-trips through parseMonth', () => {
    expect(formatMonth(parseMonth('2026-03')!)).toBe('2026-03');
  });
});

describe('monthOfDate', () => {
  /*
   * The whole reason the model is a string. A Date built for local midnight on
   * the 1st is the previous month in UTC anywhere behind Greenwich; reading the
   * month back through UTC accessors is how that surfaces.
   */
  it('reads the month in the local timezone', () => {
    expect(monthOfDate(new Date(2026, 7, 1))).toBe('2026-08');
    expect(monthOfDate(new Date(2026, 7, 31, 23, 59))).toBe('2026-08');
  });

  it('reads January as 01, not 00', () => {
    expect(monthOfDate(new Date(2026, 0, 15))).toBe('2026-01');
  });
});

describe('monthOrdinal and compareMonth', () => {
  it('orders across a year boundary', () => {
    expect(compareMonth('2025-12', '2026-01')).toBeLessThan(0);
  });

  it('is zero for the same month', () => {
    expect(compareMonth('2026-08', '2026-08')).toBe(0);
  });

  it('counts whole months between two values', () => {
    const from = monthOrdinal(parseMonth('2025-11')!);
    const to = monthOrdinal(parseMonth('2026-02')!);
    expect(to - from).toBe(3);
  });

  it('sorts an unparsable value first rather than throwing', () => {
    expect(compareMonth('nonsense', '2026-01')).toBeLessThan(0);
    expect(compareMonth('2026-01', 'nonsense')).toBeGreaterThan(0);
    expect(compareMonth(undefined, null)).toBe(0);
  });
});

describe('shiftMonth', () => {
  it('steps forward within a year', () => {
    expect(shiftMonth('2026-08', 1)).toBe('2026-09');
  });

  it('carries into the next year', () => {
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
  });

  it('carries back into the previous year', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
  });

  it('steps a whole year at a time', () => {
    expect(shiftMonth('2026-08', 12)).toBe('2027-08');
    expect(shiftMonth('2026-08', -12)).toBe('2025-08');
  });

  it('steps a grid row', () => {
    expect(shiftMonth('2026-02', 3)).toBe('2026-05');
    expect(shiftMonth('2026-02', -3)).toBe('2025-11');
  });

  /*
   * JS `%` keeps the sign of its left operand, so the naive `(ordinal % 12) + 1`
   * hands back month 0 here. Only the month is asserted: the year is negative,
   * which `yyyy-MM` cannot express and no caller can reach — the point is that
   * the month arithmetic does not wrap through zero.
   */
  it('does not produce a month zero stepping back past year zero', () => {
    expect(shiftMonth('0000-01', -1)).toMatch(/-12$/);
  });

  it('returns null for an unparsable value rather than a wrong month', () => {
    expect(shiftMonth('nonsense', 1)).toBeNull();
  });
});

describe('isMonthOutOfRange', () => {
  it('is false with no bounds', () => {
    expect(isMonthOutOfRange('2026-08')).toBe(false);
  });

  it('excludes months before min and after max', () => {
    expect(isMonthOutOfRange('2025-12', '2026-01', '2026-12')).toBe(true);
    expect(isMonthOutOfRange('2027-01', '2026-01', '2026-12')).toBe(true);
  });

  it('includes the bounds themselves', () => {
    expect(isMonthOutOfRange('2026-01', '2026-01', '2026-12')).toBe(false);
    expect(isMonthOutOfRange('2026-12', '2026-01', '2026-12')).toBe(false);
  });

  /* A typo'd bound must not quietly disable every cell in the grid — that reads
     as the screen being broken, with nothing to say which prop caused it. */
  it('ignores an unparsable bound rather than excluding everything', () => {
    expect(isMonthOutOfRange('2026-08', 'nonsense', undefined)).toBe(false);
    expect(isMonthOutOfRange('2026-08', undefined, '2026')).toBe(false);
  });
});

describe('monthName and monthLabel', () => {
  it('names months from 1, matching parseMonth rather than Date', () => {
    expect(monthName(1, AU)).toBe('January');
    expect(monthName(12, AU)).toBe('December');
  });

  it('has a short style for the grid cells', () => {
    expect(monthName(8, AU, 'short')).toBe('Aug');
  });

  it('labels a value with its year', () => {
    expect(monthLabel('2026-08', AU)).toBe('August 2026');
  });

  /*
   * The label is built from a mid-month date on purpose: local midnight on the
   * 1st is exactly where some zones put a DST transition, and an hour either
   * way there renames the month.
   */
  it('names the month itself, not a neighbour', () => {
    for (let month = 1; month <= 12; month += 1) {
      expect(monthLabel(`2026-${String(month).padStart(2, '0')}`, AU)).toBe(`${monthName(month, AU)} 2026`);
    }
  });

  it('returns null for an absent value, so callers render their own placeholder', () => {
    expect(monthLabel(undefined, AU)).toBeNull();
    expect(monthLabel('', AU)).toBeNull();
    expect(monthLabel('nonsense', AU)).toBeNull();
  });
});
