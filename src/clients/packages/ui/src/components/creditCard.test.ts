import { describe, expect, it } from 'vitest';
import { creditCardProblem, maskCreditCard, obscureCreditCard, unformatCreditCard } from './creditCard';

describe('maskCreditCard', () => {
  it('groups digits in fours', () => {
    expect(maskCreditCard('4111111111111111')).toBe('4111 1111 1111 1111');
    expect(maskCreditCard('4111-1111')).toBe('4111 1111');
  });

  it('caps at 19 digits', () => {
    expect(unformatCreditCard('1'.repeat(25)).length).toBe(19);
  });
});

describe('obscureCreditCard', () => {
  it('shows asterisks and the last four digits, grouped in fours', () => {
    expect(obscureCreditCard('4111111111111111')).toBe('**** **** **** 1111');
    expect(obscureCreditCard('4111 1111 1111 1111')).toBe('**** **** **** 1111');
  });

  it('keeps the last four as their own group for odd lengths', () => {
    expect(obscureCreditCard('411111111111111')).toBe('**** **** *** 1111');
    expect(obscureCreditCard('1234')).toBe('1234');
    expect(obscureCreditCard('123')).toBe('123');
    expect(obscureCreditCard('')).toBe('');
  });
});

describe('creditCardProblem', () => {
  it('accepts a Luhn-valid Visa test number', () => {
    expect(creditCardProblem('4111 1111 1111 1111')).toBeNull();
  });

  it('rejects a bad checksum and short drafts', () => {
    expect(creditCardProblem('4111 1111 1111 1112')).toBe('Card number failed the checksum check.');
    expect(creditCardProblem('4111 1111')).toContain('at least');
    expect(creditCardProblem('')).toBeNull();
  });
});
