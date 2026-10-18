import { describe, expect, it } from 'vitest';
import { boundDate, boundTime, joinDateTime, splitDateTime } from './dateTime';

describe('splitDateTime', () => {
  it('splits a datetime-local string', () => {
    expect(splitDateTime('2026-07-01T09:30')).toEqual({ date: '2026-07-01', time: '09:30' });
  });

  it('accepts a date-only value', () => {
    expect(splitDateTime('2026-07-01')).toEqual({ date: '2026-07-01', time: undefined });
  });

  it('treats empty as both missing', () => {
    expect(splitDateTime(undefined)).toEqual({ date: undefined, time: undefined });
    expect(splitDateTime('')).toEqual({ date: undefined, time: undefined });
  });
});

describe('joinDateTime', () => {
  it('joins date and time', () => {
    expect(joinDateTime('2026-07-01', '09:30')).toBe('2026-07-01T09:30');
  });

  it('defaults missing time to midnight', () => {
    expect(joinDateTime('2026-07-01', undefined)).toBe('2026-07-01T00:00');
    expect(joinDateTime('2026-07-01', undefined, true)).toBe('2026-07-01T00:00:00');
  });

  it('returns undefined without a date', () => {
    expect(joinDateTime(undefined, '09:30')).toBeUndefined();
  });
});

describe('boundDate / boundTime', () => {
  it('extracts the date half of a bound', () => {
    expect(boundDate('2026-07-01T09:00')).toBe('2026-07-01');
  });

  it("applies the time bound only on the bound's calendar day", () => {
    expect(boundTime('2026-07-01T09:00', '2026-07-01')).toBe('09:00');
    expect(boundTime('2026-07-01T09:00', '2026-07-02')).toBeUndefined();
    expect(boundTime('2026-07-01T09:00', undefined)).toBeUndefined();
  });
});
