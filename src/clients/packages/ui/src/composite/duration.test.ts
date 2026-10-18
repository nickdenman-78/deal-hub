import { describe, expect, it } from 'vitest';
import {
  describeDuration,
  durationError,
  formatDuration,
  isValidDuration,
  normalizeDuration,
  parseDuration,
} from './duration';

describe('parseDuration', () => {
  it.each([
    ['30s', 30_000],
    ['2h30m', 9_000_000],
    ['500ms', 500],
    ['1d', 86_400_000],
    ['1d12h', 129_600_000],
    ['1h1m1s', 3_661_000],
  ])('parses %s', (raw, expected) => {
    expect(parseDuration(raw)).toBe(expected);
  });

  /*
   * The `ms` / `m` collision. A regex alternation is matched in order, not by
   * length, so `m|ms` matches the `m` of `500ms` and leaves a stray `s` — which
   * then either fails or, worse, parses as a second term. Worth its own test
   * because the wrong version still passes for every input except this one.
   */
  it('reads ms as milliseconds, not minutes followed by seconds', () => {
    expect(parseDuration('500ms')).toBe(500);
    expect(parseDuration('5m')).toBe(300_000);
    expect(parseDuration('1m30s')).toBe(90_000);
  });

  /*
   * The load-bearing rejection. "30" is thirty of something, and which
   * something is the entire question — seconds to one service, milliseconds to
   * the next. A parser that guesses sets a timeout a thousand times too long
   * without saying anything.
   */
  it('refuses a bare number, because the unit is the question', () => {
    expect(parseDuration('30')).toBeNull();
    expect(parseDuration('1.5')).toBeNull();
  });

  // Except zero, which is the same duration in every unit.
  it('accepts a bare 0', () => {
    expect(parseDuration('0')).toBe(0);
  });

  it.each(['', '   ', 'soon', '30x', 'h', '2h30', '-5s', '5s5', undefined, null])('rejects %s', (raw) => {
    expect(parseDuration(raw)).toBeNull();
  });

  it('tolerates spacing and case, which operators type', () => {
    expect(parseDuration('2h 30m')).toBe(9_000_000);
    expect(parseDuration(' 30S ')).toBe(30_000);
  });

  it('accepts fractions and rounds to whole milliseconds', () => {
    expect(parseDuration('1.5h')).toBe(5_400_000);
    expect(parseDuration('0.5ms')).toBe(1);
  });
});

describe('formatDuration', () => {
  it.each([
    [30_000, '30s'],
    [9_000_000, '2h30m'],
    [500, '500ms'],
    [129_600_000, '1d12h'],
    [3_661_000, '1h1m1s'],
  ])('formats %i as %s', (ms, expected) => {
    expect(formatDuration(ms)).toBe(expected);
  });

  // Unset and zero are different answers, so zero has to render as something.
  it('renders zero as 0s rather than nothing', () => {
    expect(formatDuration(0)).toBe('0s');
  });

  it('returns nothing for a negative or non-finite value', () => {
    expect(formatDuration(-1)).toBe('');
    expect(formatDuration(Number.NaN)).toBe('');
  });

  it('restricts itself to the allowed units', () => {
    expect(formatDuration(9_000_000, { units: ['m'] })).toBe('150m');
    expect(formatDuration(129_600_000, { units: ['h'] })).toBe('36h');
  });

  /*
   * A remainder the allowed units cannot express. Rounding it away would report
   * a shorter duration than the one actually held, so the smallest allowed unit
   * takes it as a fraction.
   */
  it('keeps a remainder the allowed units cannot express', () => {
    expect(formatDuration(90_000, { units: ['m'] })).toBe('1m0.5m');
  });
});

describe('round trip', () => {
  it.each(['30s', '2h30m', '1d12h', '500ms', '0s'])('%s survives parse → format', (raw) => {
    expect(normalizeDuration(raw)).toBe(raw);
  });

  it('canonicalises an equivalent spelling', () => {
    expect(normalizeDuration('90m')).toBe('1h30m');
    expect(normalizeDuration('120s')).toBe('2m');
  });

  it('leaves an unparseable value alone rather than blanking it', () => {
    expect(normalizeDuration('whenever')).toBe('whenever');
  });
});

describe('describeDuration', () => {
  it('singularises a count of one', () => {
    expect(describeDuration(3_600_000)).toBe('1 hour');
    expect(describeDuration(7_200_000)).toBe('2 hours');
  });

  it('reads a compound duration out in full', () => {
    expect(describeDuration(9_000_000)).toBe('2 hours 30 minutes');
  });

  it('says none for zero and nothing for null', () => {
    expect(describeDuration(0)).toBe('none');
    expect(describeDuration(null)).toBe('');
  });
});

describe('durationError', () => {
  it('is silent on an empty optional field and complains on a required one', () => {
    expect(durationError('')).toBeUndefined();
    expect(durationError('', { required: true })).toBe('Required.');
  });

  it('names the bound it broke, in the same notation the field uses', () => {
    expect(durationError('5s', { min: 30_000 })).toBe('Minimum is 30s.');
    expect(durationError('2d', { max: 86_400_000 })).toBe('Maximum is 1d.');
    expect(durationError('1h', { min: 30_000, max: 86_400_000 })).toBeUndefined();
  });

  it('explains the format rather than just refusing', () => {
    expect(durationError('30')).toBe('Use a number and a unit, like 30s or 2h30m.');
  });
});

describe('isValidDuration', () => {
  it('agrees with parseDuration', () => {
    expect(isValidDuration('2h')).toBe(true);
    expect(isValidDuration('2')).toBe(false);
  });
});
