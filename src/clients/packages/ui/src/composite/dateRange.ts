/*
 * The value half of DateRangePicker, kept beside it so the awkward cases are
 * testable without mounting anything (the composite convention — see
 * dateTime.ts, ipv4.ts).
 *
 * A range is two optional ISO `yyyy-mm-dd` strings. ISO date strings compare
 * correctly as plain strings, which is why nothing in here constructs a Date —
 * the same UTC-midnight trap DatePicker's header documents.
 */
export interface DateRange {
  from?: string;
  to?: string;
}

export function emptyRange(): DateRange {
  return { from: undefined, to: undefined };
}

/** Both ends set. Half-open ranges are legitimate filters, not errors. */
export function isCompleteRange(range: DateRange): boolean {
  return Boolean(range.from) && Boolean(range.to);
}

export function isInvertedRange(range: DateRange): boolean {
  return Boolean(range.from && range.to && range.from > range.to);
}

/** Swap an inverted range; pass anything else through untouched. */
export function normalizeRange(range: DateRange): DateRange {
  if (!isInvertedRange(range)) return range;
  return { from: range.to, to: range.from };
}

export function rangesEqual(a: DateRange, b: DateRange): boolean {
  return (a.from ?? undefined) === (b.from ?? undefined) && (a.to ?? undefined) === (b.to ?? undefined);
}

/** Validation message, or null when the range is acceptable. */
export function rangeProblem(range: DateRange): string | null {
  if (isInvertedRange(range)) return 'The start date is after the end date.';
  return null;
}

/** Inclusive containment; half-open ranges bound only the side they have. */
export function rangeContains(range: DateRange, date: string): boolean {
  if (range.from && date < range.from) return false;
  if (range.to && date > range.to) return false;
  return true;
}
