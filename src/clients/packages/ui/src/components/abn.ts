/**
 * Australian Business Number — 11 digits, display `XX XXX XXX XXX`.
 * Checksum is ABR modulus-89 (structural only; not an ABR registry lookup).
 */

export const ABN_MAX_DIGITS = 11;

const ABN_WEIGHTS = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19] as const;

export function unformatAbn(raw: string): string {
  return (raw ?? '').replace(/\D+/g, '').slice(0, ABN_MAX_DIGITS);
}

/** Live mask: `51824753556` → `"51 824 753 556"` (resting display / blurMask). */
export function maskAbn(raw: string): string {
  const digits = unformatAbn(raw);
  if (digits === '') return '';
  if (digits.length <= 2) return digits;

  const head = digits.slice(0, 2);
  const rest = digits.slice(2);
  const groups: string[] = [];
  for (let i = 0; i < rest.length; i += 3) {
    groups.push(rest.slice(i, i + 3));
  }
  return [head, ...groups].join(' ');
}

export function isValidAbn(raw: string): boolean {
  const digits = unformatAbn(raw);
  if (digits.length !== ABN_MAX_DIGITS) return false;
  if (digits[0] === '0') return false;

  let sum = 0;
  for (let i = 0; i < ABN_MAX_DIGITS; i += 1) {
    const digit = Number(digits[i]) - (i === 0 ? 1 : 0);
    sum += digit * ABN_WEIGHTS[i]!;
  }
  return sum % 89 === 0;
}

export function abnProblem(value: string): string | null {
  const digits = unformatAbn(value);
  if (digits === '') return null;
  if (digits.length !== ABN_MAX_DIGITS) return `ABN must be ${ABN_MAX_DIGITS} digits.`;
  if (!isValidAbn(digits)) return 'ABN failed the checksum check.';
  return null;
}

export function abnRule(): (value: unknown) => true | string {
  return (value) => {
    if (typeof value !== 'string') return true;
    return abnProblem(value) ?? true;
  };
}
