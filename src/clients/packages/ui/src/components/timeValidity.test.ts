import { describe, expect, it } from 'vitest';
import { timeValidityMessage } from './timeValidity';

describe('timeValidityMessage', () => {
  const ok = { badInput: false, rangeUnderflow: false, rangeOverflow: false };

  it('is silent when the input is valid', () => {
    expect(timeValidityMessage(ok)).toBeNull();
  });

  it('rejects an impossible time (badInput)', () => {
    expect(timeValidityMessage({ ...ok, badInput: true })).toBe('Enter a valid time.');
  });

  it('names the min bound on rangeUnderflow', () => {
    expect(timeValidityMessage({ ...ok, rangeUnderflow: true }, { min: '09:00' })).toMatch(/on or after/i);
  });

  it('names the max bound on rangeOverflow', () => {
    expect(timeValidityMessage({ ...ok, rangeOverflow: true }, { max: '17:30' })).toMatch(/on or before/i);
  });
});
