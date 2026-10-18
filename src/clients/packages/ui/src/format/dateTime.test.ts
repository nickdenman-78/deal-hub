import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatLocalDateTime, formatLocalDateTimeShort, relativeAge } from './dateTime';

/*
 * These run in the machine's local timezone, so the tests assert SHAPE and
 * boundary behaviour rather than exact wall-clock strings — pinning a literal
 * would make the suite pass in Brisbane and fail in CI.
 */
describe('formatLocalDateTime', () => {
  it('zero-pads every field to a fixed width', () => {
    // 2026-01-02 03:04:05 local, built from local parts so no timezone shift.
    const iso = new Date(2026, 0, 2, 3, 4, 5).toISOString();
    expect(formatLocalDateTime(iso)).toBe('2026-01-02 03:04:05');
  });

  it('returns an unparseable input verbatim, so a bad value stays searchable', () => {
    expect(formatLocalDateTime('not-a-date')).toBe('not-a-date');
    expect(formatLocalDateTimeShort('not-a-date')).toBe('not-a-date');
  });
});

describe('formatLocalDateTimeShort', () => {
  it('drops seconds', () => {
    const iso = new Date(2026, 10, 30, 23, 59, 58).toISOString();
    expect(formatLocalDateTimeShort(iso)).toBe('2026-11-30 23:59');
  });
});

describe('relativeAge', () => {
  const NOW = new Date(2026, 5, 15, 12, 0, 0);

  afterEach(() => vi.useRealTimers());

  function ago(ms: number): string {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    return relativeAge(new Date(NOW.getTime() - ms).toISOString());
  }

  const SECOND = 1000;
  const MINUTE = 60 * SECOND;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;

  it('counts seconds below one minute', () => {
    expect(ago(0)).toBe('0s ago');
    expect(ago(59 * SECOND)).toBe('59s ago');
  });

  it('rolls over to minutes at exactly 60s', () => {
    expect(ago(60 * SECOND)).toBe('1m ago');
    expect(ago(59 * MINUTE)).toBe('59m ago');
  });

  it('rolls over to hours at exactly 60m', () => {
    expect(ago(60 * MINUTE)).toBe('1h ago');
    expect(ago(23 * HOUR)).toBe('23h ago');
  });

  it('rolls over to days at exactly 24h', () => {
    expect(ago(24 * HOUR)).toBe('1d ago');
    expect(ago(400 * DAY)).toBe('400d ago');
  });

  it('returns empty for an unparseable input, so it drops out beside an absolute stamp', () => {
    expect(relativeAge('not-a-date')).toBe('');
  });
});
