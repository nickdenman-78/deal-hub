import { describe, expect, it } from 'vitest';
import { WEEKEND_DAYS, dateAvailabilityMessage, dateValidityMessage } from './dateValidity';

describe('dateValidityMessage', () => {
  const ok = { badInput: false, rangeUnderflow: false, rangeOverflow: false };

  it('is silent when the input is valid', () => {
    expect(dateValidityMessage(ok)).toBeNull();
  });

  it('rejects an impossible calendar date (badInput)', () => {
    expect(dateValidityMessage({ ...ok, badInput: true })).toBe('Enter a valid calendar date.');
  });

  it('names the min bound on rangeUnderflow', () => {
    expect(dateValidityMessage({ ...ok, rangeUnderflow: true }, { min: '2026-07-01' })).toMatch(/on or after/i);
  });

  it('names the max bound on rangeOverflow', () => {
    expect(dateValidityMessage({ ...ok, rangeOverflow: true }, { max: '2027-06-30' })).toMatch(/on or before/i);
  });
});

describe('dateAvailabilityMessage', () => {
  it('is silent when empty or unrestricted', () => {
    expect(dateAvailabilityMessage(undefined, { disabledWeekdays: WEEKEND_DAYS })).toBeNull();
    expect(dateAvailabilityMessage('2026-07-01')).toBeNull(); // Wednesday
  });

  it('rejects weekends when disabledWeekdays is WEEKEND_DAYS', () => {
    // 2026-07-04 = Saturday, 2026-07-05 = Sunday
    expect(dateAvailabilityMessage('2026-07-04', { disabledWeekdays: WEEKEND_DAYS })).toBe(
      'Weekends are not available.',
    );
    expect(dateAvailabilityMessage('2026-07-05', { disabledWeekdays: WEEKEND_DAYS })).toBe(
      'Weekends are not available.',
    );
  });

  it('names a single disabled weekday', () => {
    // 2026-07-01 = Wednesday
    expect(dateAvailabilityMessage('2026-07-01', { disabledWeekdays: [3] })).toBe('Wednesdays are not available.');
  });

  it('rejects specific unavailable dates (holidays)', () => {
    expect(dateAvailabilityMessage('2026-12-25', { disabledDates: ['2026-12-25', '2026-12-26'] })).toBe(
      'This date is unavailable.',
    );
  });

  it('prefers a holiday message over a weekday message', () => {
    // 2026-12-25 is a Friday — also in disabledWeekdays would still say unavailable date first
    expect(
      dateAvailabilityMessage('2026-12-25', {
        disabledWeekdays: [5],
        disabledDates: ['2026-12-25'],
      }),
    ).toBe('This date is unavailable.');
  });
});
