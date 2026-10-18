/**
 * Input masking helpers — sanitize into `v-model` (no display-only tokens) and
 * optional resting formatters for `MaskedInput` `blurMask`.
 *
 * The id-name preset mirrors config-admin's `idName` / server `IdNameRules`:
 * lowercase, letter-leading, single hyphens between alnum runs, max 64.
 * Trailing `-` is kept while typing so a space mid-word still works; strip it
 * on submit with `{ trimTrailingDash: true }`.
 */

export type MaskFn = (raw: string) => string;

export const ID_NAME_MAX = 64;

export const ID_NAME_REGEX = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
export const ID_NAME_MIXED_REGEX = /^[A-Za-z][A-Za-z0-9]*(-[A-Za-z0-9]+)*$/;

export const ID_NAME_DESCRIPTION =
  'must be lowercase, start with a letter, and contain only letters, digits, and ' +
  "single hyphens (no leading/trailing hyphen, no '--')";

export const ID_NAME_MIXED_DESCRIPTION =
  'must start with a letter and contain only letters, digits, and single hyphens ' +
  "(no leading/trailing hyphen, no '--')";

export function normalizeIdName(
  raw: string,
  opts: { trimTrailingDash?: boolean; allowUppercase?: boolean; maxLength?: number } = {},
): string {
  const upper = opts.allowUppercase === true;
  const max = opts.maxLength ?? ID_NAME_MAX;
  let v = raw ?? '';
  if (!upper) v = v.toLowerCase();
  v = v
    .replace(/\s+/g, '-')
    .replace(upper ? /[^A-Za-z0-9-]/g : /[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(upper ? /^[^A-Za-z]+/ : /^[^a-z]+/, '');
  if (opts.trimTrailingDash) {
    v = v.replace(/-+$/, '');
  }
  return v.slice(0, max);
}

/** Human error when non-empty and invalid; empty is the caller's required-field job. */
export function idNameProblem(
  value: string,
  opts: { reserved?: ReadonlySet<string>; allowUppercase?: boolean } = {},
): string | null {
  const v = value.trim();
  if (v === '') return null;
  if (v.length > ID_NAME_MAX) return `Name must be ${ID_NAME_MAX} characters or fewer.`;
  if (opts.reserved?.has(v.toLowerCase())) return `'${v}' is reserved.`;
  const upper = opts.allowUppercase === true;
  const re = upper ? ID_NAME_MIXED_REGEX : ID_NAME_REGEX;
  if (!re.test(v)) return `Name ${upper ? ID_NAME_MIXED_DESCRIPTION : ID_NAME_DESCRIPTION}.`;
  return null;
}

/** Drop into Input / MaskedInput `rules` for blur/submit validation. */
export function idNameRule(
  opts: { reserved?: ReadonlySet<string>; allowUppercase?: boolean } = {},
): (value: unknown) => true | string {
  return (value) => {
    if (typeof value !== 'string') return true;
    return idNameProblem(value, opts) ?? true;
  };
}

/* ── Currency ─────────────────────────────────────────────────────────────
 * `maskCurrency` / `unformatCurrency` are the raw model form. `formatCurrency`
 * is display-only for `MaskedInput` `blurMask` or `NumberInput` resting text.
 */

/** Focus draft: strip grouping / junk, keep a plain numeric string. */
export function unformatCurrency(raw: string, opts: { fractionDigits?: number; allowNegative?: boolean } = {}): string {
  return maskCurrency(raw, opts);
}

/**
 * Sanitize a typed amount: optional leading minus, digits, at most one `.`,
 * at most `fractionDigits` after it. No thousands separators.
 */
export function maskCurrency(raw: string, opts: { fractionDigits?: number; allowNegative?: boolean } = {}): string {
  const fractionDigits = opts.fractionDigits ?? 2;
  const allowNegative = opts.allowNegative !== false;
  let v = (raw ?? '').replace(/,/g, '').replace(/\s+/g, '');
  if (!allowNegative) v = v.replace(/-/g, '');

  const negative = allowNegative && v.startsWith('-');
  v = v.replace(/-/g, '');

  const dot = v.indexOf('.');
  let intPart: string;
  let fracPart: string | undefined;
  if (dot === -1) {
    intPart = v.replace(/\D+/g, '');
  } else {
    intPart = v.slice(0, dot).replace(/\D+/g, '');
    fracPart = v
      .slice(dot + 1)
      .replace(/\D+/g, '')
      .slice(0, fractionDigits);
  }

  let out = intPart;
  if (dot !== -1) out = `${intPart}.${fracPart ?? ''}`;
  if (negative && out !== '') out = `-${out}`;
  else if (negative && out === '') out = '-';
  return out;
}

/**
 * Blur normaliser. Empty / lone `-` / lone `.` stay as-is so a mid-edit blur
 * does not invent `0.00`. Otherwise: grouping separators + fixed decimals.
 */
export function formatCurrency(
  raw: string,
  opts: { fractionDigits?: number; locale?: string; allowNegative?: boolean } = {},
): string {
  const fractionDigits = opts.fractionDigits ?? 2;
  // Keep extra draft precision so `toLocaleString` can round (178.456 → 178.46).
  const draft = maskCurrency(raw, {
    fractionDigits: Math.max(fractionDigits, 12),
    allowNegative: opts.allowNegative,
  });
  if (draft === '' || draft === '-' || draft === '.' || draft === '-.') return draft;

  const n = Number(draft);
  if (!Number.isFinite(n)) return draft;

  return n.toLocaleString(opts.locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

/**
 * Wire-facing amount: no grouping separators. Applies `fractionDigits` via
 * `toFixed` (always `.` as the decimal). Empty / incomplete drafts stay empty.
 */
export function rawCurrency(raw: string, opts: { fractionDigits?: number; allowNegative?: boolean } = {}): string {
  const fractionDigits = opts.fractionDigits ?? 2;
  const draft = maskCurrency(raw, {
    fractionDigits: Math.max(fractionDigits, 12),
    allowNegative: opts.allowNegative,
  });
  if (draft === '' || draft === '-' || draft === '.' || draft === '-.') return '';

  const n = Number(draft);
  if (!Number.isFinite(n)) return draft;
  return n.toFixed(fractionDigits);
}

/* ── Australian telephone numbers ─────────────────────────────────────────
 * Display follows the Australian Government Style Manual
 * (https://www.stylemanual.gov.au/…/telephone-numbers):
 *
 *   Mobile domestic:        04XX XXX XXX
 *   Landline domestic:      0A XXXX XXXX
 *   Mobile international:   +61 4XX XXX XXX
 *   Landline international: +61 A XXXX XXXX
 *
 * Models stay raw: national numbers are digits only; international keeps a
 * leading `+` plus digits (E.164-shaped). Grouping spaces are blurMask only.
 */

export const AU_MOBILE_MAX_DIGITS = 10;
export const AU_LANDLINE_MAX_DIGITS = 10;
/** Country code + 9-digit national significant number (trunk 0 dropped). */
export const AU_INTL_MAX_DIGITS = 11;

/** Digits only, capped — the editable form behind spaced display. */
export function unformatAuMobile(raw: string): string {
  return (raw ?? '').replace(/\D+/g, '').slice(0, AU_MOBILE_MAX_DIGITS);
}

/** Resting AU mobile: `0412345678` → `"0412 345 678"`. */
export function maskAuMobile(raw: string): string {
  const digits = unformatAuMobile(raw);
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
}

/** Digits only, capped — domestic landline (area code + local number). */
export function unformatAuLandline(raw: string): string {
  return (raw ?? '').replace(/\D+/g, '').slice(0, AU_LANDLINE_MAX_DIGITS);
}

/** Resting AU landline: `0255504321` → `"02 5550 4321"`. */
export function maskAuLandline(raw: string): string {
  const digits = unformatAuLandline(raw);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
  return `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`;
}

/**
 * International AU model: leading `+` plus digits, max `+61` and 9 NSN digits.
 * Non-digit junk is stripped; a typed `+` is preserved while the field is empty.
 */
export function unformatAuIntlPhone(raw: string): string {
  const text = raw ?? '';
  const wantsPlus = text.trimStart().startsWith('+');
  const digits = text.replace(/\D+/g, '').slice(0, AU_INTL_MAX_DIGITS);
  if (digits === '') return wantsPlus ? '+' : '';
  return `+${digits}`;
}

/**
 * Resting international AU display. After `+61`, mobiles are three groups of
 * three (`+61 491 570 159`); landlines are area digit + two fours
 * (`+61 2 5550 4321`). Incomplete values are spaced as far as they go.
 */
export function maskAuIntlPhone(raw: string): string {
  const digits = (raw ?? '').replace(/\D+/g, '').slice(0, AU_INTL_MAX_DIGITS);
  if (digits === '') return '';

  if (!digits.startsWith('61')) {
    return `+${digits}`;
  }

  const nsn = digits.slice(2);
  if (nsn === '') return '+61';

  // Mobile NSN starts with 4 → +61 4XX XXX XXX
  if (nsn.startsWith('4')) {
    const parts = ['+61'];
    if (nsn.length <= 3) {
      parts.push(nsn);
    } else if (nsn.length <= 6) {
      parts.push(nsn.slice(0, 3), nsn.slice(3));
    } else {
      parts.push(nsn.slice(0, 3), nsn.slice(3, 6), nsn.slice(6, 9));
    }
    return parts.join(' ');
  }

  // Landline → +61 A XXXX XXXX
  const parts = ['+61'];
  if (nsn.length <= 1) {
    parts.push(nsn);
  } else if (nsn.length <= 5) {
    parts.push(nsn.slice(0, 1), nsn.slice(1));
  } else {
    parts.push(nsn.slice(0, 1), nsn.slice(1, 5), nsn.slice(5, 9));
  }
  return parts.join(' ');
}

/**
 * Group digits from the end. Kept for ad-hoc masks; prefer the AU helpers above
 * for telephone numbers.
 */
export function formatDigitGroups(
  raw: string,
  opts: { groupSize?: number; separator?: string; maxDigits?: number } = {},
): string {
  const groupSize = opts.groupSize ?? 3;
  const separator = opts.separator ?? ' ';
  const maxDigits = opts.maxDigits ?? Number.POSITIVE_INFINITY;
  const digits = (raw ?? '').replace(/\D+/g, '').slice(0, maxDigits);
  if (digits === '') return '';

  const groups: string[] = [];
  for (let i = digits.length; i > 0; i -= groupSize) {
    groups.unshift(digits.slice(Math.max(0, i - groupSize), i));
  }
  return groups.join(separator);
}
