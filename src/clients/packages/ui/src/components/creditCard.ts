/**
 * Credit card number — digits only in the model, grouped in fours when resting.
 * Optional Luhn check for complete numbers (13–19 digits).
 */

export const CREDIT_CARD_MAX_DIGITS = 19;
export const CREDIT_CARD_MIN_DIGITS = 13;

export function unformatCreditCard(raw: string): string {
  return (raw ?? '').replace(/\D+/g, '').slice(0, CREDIT_CARD_MAX_DIGITS);
}

/** Digits only, grouped in fours for resting display. */
export function maskCreditCard(raw: string): string {
  return groupInFours(unformatCreditCard(raw));
}

/**
 * Resting display only — asterisks for all but the last four digits, with the
 * last four kept as their own group. Never written to `v-model`.
 */
export function obscureCreditCard(raw: string): string {
  const digits = unformatCreditCard(raw);
  if (digits === '') return '';
  if (digits.length <= 4) return digits;
  return `${groupInFours('*'.repeat(digits.length - 4))} ${digits.slice(-4)}`;
}

function groupInFours(value: string): string {
  if (value === '') return '';
  const groups: string[] = [];
  for (let i = 0; i < value.length; i += 4) {
    groups.push(value.slice(i, i + 4));
  }
  return groups.join(' ');
}

/** Luhn check digit. Incomplete lengths are not errors here — empty is required's job. */
export function creditCardProblem(value: string): string | null {
  const digits = unformatCreditCard(value);
  if (digits === '') return null;
  if (digits.length < CREDIT_CARD_MIN_DIGITS) {
    return `Card number must be at least ${CREDIT_CARD_MIN_DIGITS} digits.`;
  }
  if (!luhnValid(digits)) return 'Card number failed the checksum check.';
  return null;
}

export function creditCardRule(): (value: unknown) => true | string {
  return (value) => {
    if (typeof value !== 'string') return true;
    return creditCardProblem(value) ?? true;
  };
}

function luhnValid(digits: string): boolean {
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = Number(digits[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}
