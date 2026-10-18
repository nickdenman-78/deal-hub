/**
 * National Metering Identifier (NEM) — 10 alphanumeric characters, optionally
 * followed by the AEMO Luhn-10 checksum digit (11 chars total).
 *
 * Algorithm matches `Retail.Core.Domain.Specifications.Luhn10` / AEMO MSATS
 * NMI Procedure: ASCII values, double alternate from the right, sum digits,
 * check digit = next multiple of 10 minus sum (0 if that is 10).
 */

export const NMI_BODY_LENGTH = 10;
export const NMI_WITH_CHECKSUM_LENGTH = 11;

/** Digits/letters only, uppercased, capped at 11. */
export function unformatNmi(raw: string): string {
  return (raw ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, NMI_WITH_CHECKSUM_LENGTH);
}

/**
 * Resting display: uppercase alnum, max 11. Inserts a space before the checksum
 * digit when present — `NCCC0043026` → `"NCCC004302 6"`.
 */
export function maskNmi(raw: string): string {
  const chars = unformatNmi(raw);
  if (chars.length <= NMI_BODY_LENGTH) return chars;
  return `${chars.slice(0, NMI_BODY_LENGTH)} ${chars.slice(NMI_BODY_LENGTH)}`;
}

/** Check digit for a 10-character NMI body. */
export function nmiChecksum(body: string): number {
  const value = unformatNmi(body).slice(0, NMI_BODY_LENGTH);
  let sum = 0;
  for (let i = value.length - 1; i >= 0; i -= 1) {
    let ascii = value.charCodeAt(i);
    // Right-most and every second character reading left are doubled.
    if ((value.length - i) % 2 === 1) ascii *= 2;
    while (ascii > 0) {
      sum += ascii % 10;
      ascii = Math.floor(ascii / 10);
    }
  }
  const nextMultiple = (Math.floor(sum / 10) + 1) * 10;
  const check = nextMultiple - sum;
  return check === 10 ? 0 : check;
}

export function isValidNmi(raw: string): boolean {
  return nmiProblem(raw) === null && unformatNmi(raw).length >= NMI_BODY_LENGTH;
}

export function nmiProblem(value: string): string | null {
  const chars = unformatNmi(value);
  if (chars === '') return null;
  if (chars.length < NMI_BODY_LENGTH) {
    return `NMI must be ${NMI_BODY_LENGTH} characters (${NMI_WITH_CHECKSUM_LENGTH} with checksum).`;
  }
  if (chars.length > NMI_WITH_CHECKSUM_LENGTH) {
    return `NMI must be ${NMI_BODY_LENGTH} characters (${NMI_WITH_CHECKSUM_LENGTH} with checksum).`;
  }
  if (chars.length === NMI_WITH_CHECKSUM_LENGTH) {
    const expected = nmiChecksum(chars.slice(0, NMI_BODY_LENGTH));
    if (Number(chars[NMI_BODY_LENGTH]) !== expected) {
      return 'NMI failed the checksum check.';
    }
  }
  return null;
}

export function nmiRule(): (value: unknown) => true | string {
  return (value) => {
    if (typeof value !== 'string') return true;
    return nmiProblem(value) ?? true;
  };
}
