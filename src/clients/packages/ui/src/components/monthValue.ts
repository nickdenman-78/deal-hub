/**
 * The value model behind `MonthPicker`.
 *
 * A month is an ISO `yyyy-MM` string — the same string `<input type="month">`
 * speaks, so a screen already on the native control can move across without
 * touching its bindings, and the value goes into a query string as-is.
 *
 * Deliberately NOT a `Date`. A month has no day, and every representation that
 * invents one invites the timezone bug that `DatePicker` documents at length:
 * `new Date('2026-08')` parses as UTC midnight on the 1st, which is July
 * anywhere behind UTC. Keeping it a string means the wrong month cannot be
 * rendered for some users, in some timezones, some of the time.
 *
 * Everything here is total: an unparsable value is `null`, never a throw and
 * never a silently wrong month. Callers get a value they can render or an
 * absence they must handle.
 */

export interface MonthParts {
  /** Full year, e.g. 2026. */
  year: number;
  /** 1–12, NOT the 0-based month of `Date#getMonth`. */
  month: number;
}

/** Strict `yyyy-MM`: four digits, a hyphen, and a real month. */
const MONTH_PATTERN = /^(\d{4})-(\d{2})$/;

export function parseMonth(value: string | null | undefined): MonthParts | null {
  if (!value) return null;

  const match = MONTH_PATTERN.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  // `2026-13` matches the shape and is not a month. Rejecting it here is what
  // keeps the grid from rendering a thirteenth cell.
  if (month < 1 || month > 12) return null;

  return { year, month };
}

export function formatMonth(parts: MonthParts): string {
  return `${String(parts.year).padStart(4, '0')}-${String(parts.month).padStart(2, '0')}`;
}

/** The month `date` falls in, in the LOCAL timezone — which is the one the user is in. */
export function monthOfDate(date: Date): string {
  return formatMonth({ year: date.getFullYear(), month: date.getMonth() + 1 });
}

/**
 * Ordering as a single comparable number, so `min`/`max` comparisons do not go
 * through Date and cannot drift by a day.
 */
export function monthOrdinal(parts: MonthParts): number {
  return parts.year * 12 + (parts.month - 1);
}

/** Negative, zero or positive, like any comparator. Unparsable sorts first. */
export function compareMonth(a: string | null | undefined, b: string | null | undefined): number {
  const left = parseMonth(a);
  const right = parseMonth(b);
  if (!left && !right) return 0;
  if (!left) return -1;
  if (!right) return 1;
  return monthOrdinal(left) - monthOrdinal(right);
}

/** Steps by whole months, carrying the year. `delta` may be negative. */
export function shiftMonth(value: string, delta: number): string | null {
  const parts = parseMonth(value);
  if (!parts) return null;

  const ordinal = monthOrdinal(parts) + delta;
  // Floored division and a non-negative remainder: JS `%` keeps the sign of the
  // left operand, which would hand back month 0 stepping back past year 0.
  const year = Math.floor(ordinal / 12);
  return formatMonth({ year, month: ordinal - year * 12 + 1 });
}

/**
 * Whether a month falls outside `min`/`max`. An unparsable bound is no bound —
 * a typo'd `max` must not silently disable the whole grid.
 */
export function isMonthOutOfRange(value: string, min?: string | null, max?: string | null): boolean {
  if (!parseMonth(value)) return false;
  if (min && parseMonth(min) && compareMonth(value, min) < 0) return true;
  if (max && parseMonth(max) && compareMonth(value, max) > 0) return true;
  return false;
}

/*
 * Labels come from Intl rather than a hardcoded table: the trigger shows a
 * month name to a person, and the platform already knows how that is written
 * wherever they are. The VALUE is never localised — that stays `yyyy-MM`.
 *
 * The 15th, not the 1st: `new Date(year, month - 1, 1)` is local midnight on
 * the first, which some zones' DST transitions land exactly on. Mid-month
 * cannot be pushed into a neighbouring month by an hour either way.
 */
function dateForLabel(parts: MonthParts): Date {
  return new Date(parts.year, parts.month - 1, 15);
}

export function monthName(month: number, locale?: string, style: 'long' | 'short' = 'long'): string {
  return new Intl.DateTimeFormat(locale, { month: style }).format(dateForLabel({ year: 2000, month }));
}

/** "August 2026" — what the trigger shows. Returns `null` so callers render their own placeholder. */
export function monthLabel(
  value: string | null | undefined,
  locale?: string,
  style: 'long' | 'short' = 'long',
): string | null {
  const parts = parseMonth(value);
  if (!parts) return null;

  return new Intl.DateTimeFormat(locale, { month: style, year: 'numeric' }).format(dateForLabel(parts));
}
