import { describe, expect, it } from 'vitest';
import { acnProblem, isValidAcn, maskAcn, unformatAcn } from './acn';

describe('maskAcn', () => {
  it('formats as XXX XXX XXX', () => {
    expect(maskAcn('004085616')).toBe('004 085 616');
    expect(maskAcn('00408')).toBe('004 08');
  });
});

describe('isValidAcn / acnProblem', () => {
  it('accepts known valid ACNs', () => {
    expect(isValidAcn('004085616')).toBe(true);
    expect(isValidAcn('604475587')).toBe(true);
    expect(acnProblem('004 085 616')).toBeNull();
  });

  it('rejects wrong length and bad checksums', () => {
    expect(acnProblem('004085617')).toBe('ACN failed the checksum check.');
    expect(acnProblem('00408561')).toBe('ACN must be 9 digits.');
    expect(acnProblem('')).toBeNull();
    expect(unformatAcn('004 085 616')).toBe('004085616');
  });
});
