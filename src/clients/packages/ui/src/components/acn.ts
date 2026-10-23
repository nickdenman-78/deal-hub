/**
 * Australian Company Number — 9 digits, display `XXX XXX XXX` (ASIC convention).
 * Last digit is a modified modulus-10 check digit.
 */

export const ACN_MAX_DIGITS = 9;

const ACN_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 1] as const;

export function unformatAcn(raw: string): string {
  return (raw ?? '').replace(/\D+/g, '').slice(0, ACN_MAX_DIGITS);
}

/** Resting display: `004085616` → `"004 085 616"`. */
export function maskAcn(raw: string): string {
  const digits = unformatAcn(raw);
  if (digits === '') return '';
  const groups: string[] = [];
  for (let i = 0; i < digits.length; i += 3) {
    groups.push(digits.slice(i, i + 3));
  }
  return groups.join(' ');
}

export function isValidAcn(raw: string): boolean {
  const digits = unformatAcn(raw);
  if (digits.length !== ACN_MAX_DIGITS) return false;

  let sum = 0;
  for (let i = 0; i < 8; i += 1) {
    sum += Number(digits[i]) * ACN_WEIGHTS[i]!;
  }
  const check = (10 - (sum % 10)) % 10;
  return Number(digits[8]) === check;
}

export function acnProblem(value: string): string | null {
  const digits = unformatAcn(value);
  if (digits === '') return null;
  if (digits.length !== ACN_MAX_DIGITS) return `ACN must be ${ACN_MAX_DIGITS} digits.`;
  if (!isValidAcn(digits)) return 'ACN failed the checksum check.';
  return null;
}

export function acnRule(): (value: unknown) => true | string {
  return (value) => {
    if (typeof value !== 'string') return true;
    return acnProblem(value) ?? true;
  };
}
