/*
 * Relative date-range presets for DateRangeSelector.
 *
 * Presets snapshot into a DateRange (ISO yyyy-mm-dd) when chosen — callers
 * keep the existing DateRange model; the catalog only answers "what does
 * 'Last 7 days' mean for this local today?". Calendar math uses local
 * Date parts and formats back to ISO strings — never Date#toISOString(),
 * which is the UTC-midnight trap DatePicker documents.
 */
import { emptyRange, rangesEqual, type DateRange } from './dateRange';

export interface DateRangePresetContext {
  /** Local calendar today as yyyy-mm-dd (never UTC-sliced from Date#toISOString). */
  today: string;
}

export interface DateRangePreset {
  id: string;
  label: string;
  /** Inclusive local bounds for `ctx.today`. Return ISO date strings only. */
  resolve: (ctx: DateRangePresetContext) => DateRange;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Format local y/m/d (1-based month) as ISO, allowing day overflow via Date. */
export function formatLocalYmd(year: number, month: number, day: number): string {
  const dt = new Date(year, month - 1, day);
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
}

function parseLocalYmd(iso: string): { y: number; m: number; d: number } {
  if (!ISO_DATE.test(iso)) {
    throw new Error(`Expected yyyy-mm-dd, got "${iso}"`);
  }
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d };
}

/** Local calendar today as yyyy-mm-dd. */
export function localToday(): string {
  const now = new Date();
  return formatLocalYmd(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function addLocalDays(iso: string, delta: number): string {
  const { y, m, d } = parseLocalYmd(iso);
  return formatLocalYmd(y, m, d + delta);
}

/**
 * Start of the week containing `iso`.
 * @param weekStartsOn 0 = Sunday … 6 = Saturday; default 1 (Monday, AU).
 */
export function startOfLocalWeek(iso: string, weekStartsOn = 1): string {
  const { y, m, d } = parseLocalYmd(iso);
  const dt = new Date(y, m - 1, d);
  const day = dt.getDay();
  const offset = (day - weekStartsOn + 7) % 7;
  return addLocalDays(iso, -offset);
}

export function endOfLocalWeek(iso: string, weekStartsOn = 1): string {
  return addLocalDays(startOfLocalWeek(iso, weekStartsOn), 6);
}

export function startOfLocalMonth(iso: string): string {
  const { y, m } = parseLocalYmd(iso);
  return formatLocalYmd(y, m, 1);
}

export function endOfLocalMonth(iso: string): string {
  const { y, m } = parseLocalYmd(iso);
  // Day 0 of next month = last day of this month.
  return formatLocalYmd(y, m + 1, 0);
}

export function startOfLocalYear(iso: string): string {
  const { y } = parseLocalYmd(iso);
  return formatLocalYmd(y, 1, 1);
}

export function endOfLocalYear(iso: string): string {
  const { y } = parseLocalYmd(iso);
  return formatLocalYmd(y, 12, 31);
}

/** Inclusive window of `n` days ending on `today` (n=7 → today and the prior 6). */
export function lastNDaysRange(today: string, n: number): DateRange {
  if (n < 1) return emptyRange();
  return { from: addLocalDays(today, -(n - 1)), to: today };
}

function isoToAuDisplay(iso: string): string {
  const { y, m, d } = parseLocalYmd(iso);
  return `${pad2(d)}/${pad2(m)}/${y}`;
}

/**
 * Collapsed custom-range label. Complete ranges use en-AU day/month/year;
 * half-open ranges keep an ellipsis on the missing side; empty → ''.
 */
export function formatDateRangeLabel(range: DateRange): string {
  const from = range.from;
  const to = range.to;
  if (!from && !to) return '';
  if (from && to) return `${isoToAuDisplay(from)} – ${isoToAuDisplay(to)}`;
  if (from) return `${isoToAuDisplay(from)} – …`;
  return `… – ${isoToAuDisplay(to!)}`;
}

/** First preset whose resolve(today) equals `range`, or null. */
export function matchDateRangePreset(
  range: DateRange,
  presets: readonly DateRangePreset[],
  today: string,
): DateRangePreset | null {
  const ctx: DateRangePresetContext = { today };
  for (const preset of presets) {
    if (rangesEqual(range, preset.resolve(ctx))) return preset;
  }
  return null;
}

const WEEK_STARTS_ON = 1; // Monday

/** Built-in catalog — ids are stable; labels are operator-facing English. */
export const DEFAULT_DATE_RANGE_PRESETS: readonly DateRangePreset[] = [
  {
    id: 'today',
    label: 'Today',
    resolve: ({ today }) => ({ from: today, to: today }),
  },
  {
    id: 'yesterday',
    label: 'Yesterday',
    resolve: ({ today }) => {
      const day = addLocalDays(today, -1);
      return { from: day, to: day };
    },
  },
  {
    id: 'last-7-days',
    label: 'Last 7 days',
    resolve: ({ today }) => lastNDaysRange(today, 7),
  },
  {
    id: 'last-30-days',
    label: 'Last 30 days',
    resolve: ({ today }) => lastNDaysRange(today, 30),
  },
  {
    id: 'this-week',
    label: 'This week',
    resolve: ({ today }) => ({
      from: startOfLocalWeek(today, WEEK_STARTS_ON),
      to: endOfLocalWeek(today, WEEK_STARTS_ON),
    }),
  },
  {
    id: 'last-week',
    label: 'Last week',
    resolve: ({ today }) => {
      const thisStart = startOfLocalWeek(today, WEEK_STARTS_ON);
      const lastStart = addLocalDays(thisStart, -7);
      return { from: lastStart, to: addLocalDays(lastStart, 6) };
    },
  },
  {
    id: 'this-month',
    label: 'This month',
    resolve: ({ today }) => ({
      from: startOfLocalMonth(today),
      to: endOfLocalMonth(today),
    }),
  },
  {
    id: 'last-month',
    label: 'Last month',
    resolve: ({ today }) => {
      const thisStart = startOfLocalMonth(today);
      const lastEnd = addLocalDays(thisStart, -1);
      return { from: startOfLocalMonth(lastEnd), to: lastEnd };
    },
  },
];
