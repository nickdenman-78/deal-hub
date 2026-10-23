import { describe, expect, it } from 'vitest';
import {
  addLocalDays,
  DEFAULT_DATE_RANGE_PRESETS,
  endOfLocalMonth,
  endOfLocalWeek,
  endOfLocalYear,
  formatDateRangeLabel,
  formatLocalYmd,
  lastNDaysRange,
  matchDateRangePreset,
  startOfLocalMonth,
  startOfLocalWeek,
  startOfLocalYear,
} from './dateRangePresets';

describe('dateRangePresets calendar math', () => {
  it('addLocalDays crosses month and year boundaries in local time', () => {
    expect(addLocalDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addLocalDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addLocalDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('starts weeks on Monday by default (AU)', () => {
    // 2026-08-12 is a Wednesday.
    expect(startOfLocalWeek('2026-08-12')).toBe('2026-08-10');
    expect(endOfLocalWeek('2026-08-12')).toBe('2026-08-16');
    // Sunday belongs to the week that started the prior Monday.
    expect(startOfLocalWeek('2026-08-16')).toBe('2026-08-10');
  });

  it('honours weekStartsOn = Sunday', () => {
    expect(startOfLocalWeek('2026-08-12', 0)).toBe('2026-08-09');
    expect(endOfLocalWeek('2026-08-12', 0)).toBe('2026-08-15');
  });

  it('bounds months and years', () => {
    expect(startOfLocalMonth('2026-08-12')).toBe('2026-08-01');
    expect(endOfLocalMonth('2026-08-12')).toBe('2026-08-31');
    expect(endOfLocalMonth('2026-02-10')).toBe('2026-02-28');
    expect(startOfLocalYear('2026-08-12')).toBe('2026-01-01');
    expect(endOfLocalYear('2026-08-12')).toBe('2026-12-31');
  });

  it('lastNDaysRange is inclusive of today', () => {
    expect(lastNDaysRange('2026-08-12', 7)).toEqual({ from: '2026-08-06', to: '2026-08-12' });
    expect(lastNDaysRange('2026-08-12', 1)).toEqual({ from: '2026-08-12', to: '2026-08-12' });
  });

  it('formatLocalYmd absorbs day overflow', () => {
    expect(formatLocalYmd(2026, 1, 32)).toBe('2026-02-01');
  });
});

describe('formatDateRangeLabel', () => {
  it('formats complete ranges as en-AU day/month/year', () => {
    expect(formatDateRangeLabel({ from: '2026-07-01', to: '2026-07-31' })).toBe('01/07/2026 – 31/07/2026');
  });

  it('handles empty and half-open ranges', () => {
    expect(formatDateRangeLabel({})).toBe('');
    expect(formatDateRangeLabel({ from: '2026-07-01' })).toBe('01/07/2026 – …');
    expect(formatDateRangeLabel({ to: '2026-07-31' })).toBe('… – 31/07/2026');
  });
});

describe('DEFAULT_DATE_RANGE_PRESETS', () => {
  const today = '2026-08-12'; // Wednesday
  const ctx = { today };

  it('resolves each built-in preset', () => {
    const byId = Object.fromEntries(DEFAULT_DATE_RANGE_PRESETS.map((p) => [p.id, p.resolve(ctx)]));
    expect(byId['today']).toEqual({ from: '2026-08-12', to: '2026-08-12' });
    expect(byId['yesterday']).toEqual({ from: '2026-08-11', to: '2026-08-11' });
    expect(byId['last-7-days']).toEqual({ from: '2026-08-06', to: '2026-08-12' });
    expect(byId['last-30-days']).toEqual({ from: '2026-07-14', to: '2026-08-12' });
    expect(byId['this-week']).toEqual({ from: '2026-08-10', to: '2026-08-16' });
    expect(byId['last-week']).toEqual({ from: '2026-08-03', to: '2026-08-09' });
    expect(byId['this-month']).toEqual({ from: '2026-08-01', to: '2026-08-31' });
    expect(byId['last-month']).toEqual({ from: '2026-07-01', to: '2026-07-31' });
  });

  it('matchDateRangePreset finds the preset that still matches today', () => {
    const last7 = DEFAULT_DATE_RANGE_PRESETS.find((p) => p.id === 'last-7-days')!;
    const range = last7.resolve(ctx);
    expect(matchDateRangePreset(range, DEFAULT_DATE_RANGE_PRESETS, today)?.id).toBe('last-7-days');
    expect(
      matchDateRangePreset({ from: '2020-01-01', to: '2020-01-02' }, DEFAULT_DATE_RANGE_PRESETS, today),
    ).toBeNull();
  });
});
