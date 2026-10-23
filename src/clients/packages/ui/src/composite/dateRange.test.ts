import { describe, expect, it } from 'vitest';
import {
  emptyRange,
  isCompleteRange,
  isInvertedRange,
  normalizeRange,
  rangeContains,
  rangeProblem,
  rangesEqual,
} from './dateRange';

describe('dateRange', () => {
  it('treats half-open ranges as legitimate, not inverted', () => {
    expect(isInvertedRange({ from: '2026-08-01' })).toBe(false);
    expect(isInvertedRange({ to: '2026-08-01' })).toBe(false);
    expect(isCompleteRange({ from: '2026-08-01' })).toBe(false);
    expect(rangeProblem({ from: '2026-08-01' })).toBeNull();
  });

  it('detects inversion by plain string comparison of ISO dates', () => {
    expect(isInvertedRange({ from: '2026-08-11', to: '2026-08-01' })).toBe(true);
    expect(isInvertedRange({ from: '2026-08-01', to: '2026-08-11' })).toBe(false);
    // Same day is a valid single-day range.
    expect(isInvertedRange({ from: '2026-08-11', to: '2026-08-11' })).toBe(false);
  });

  it('normalizeRange swaps only inverted ranges', () => {
    expect(normalizeRange({ from: '2026-08-11', to: '2026-08-01' })).toEqual({
      from: '2026-08-01',
      to: '2026-08-11',
    });
    const ok = { from: '2026-08-01', to: '2026-08-11' };
    expect(normalizeRange(ok)).toBe(ok);
  });

  it('rangeProblem names the inversion and nothing else', () => {
    expect(rangeProblem({ from: '2026-08-11', to: '2026-08-01' })).toMatch(/after/);
    expect(rangeProblem(emptyRange())).toBeNull();
  });

  it('rangeContains bounds only the sides it has', () => {
    expect(rangeContains({ from: '2026-08-01', to: '2026-08-11' }, '2026-08-05')).toBe(true);
    expect(rangeContains({ from: '2026-08-01', to: '2026-08-11' }, '2026-08-11')).toBe(true); // inclusive
    expect(rangeContains({ from: '2026-08-01' }, '2030-01-01')).toBe(true);
    expect(rangeContains({ to: '2026-08-11' }, '2026-08-12')).toBe(false);
    expect(rangeContains(emptyRange(), '1999-01-01')).toBe(true);
  });

  it('rangesEqual treats missing and undefined ends alike', () => {
    expect(rangesEqual({}, emptyRange())).toBe(true);
    expect(rangesEqual({ from: '2026-08-01' }, { from: '2026-08-01', to: undefined })).toBe(true);
    expect(rangesEqual({ from: '2026-08-01' }, { from: '2026-08-02' })).toBe(false);
  });
});
