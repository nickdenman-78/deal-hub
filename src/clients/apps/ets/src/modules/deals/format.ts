/*
 * Display formatting for the deals screens. NEM time is AEST all year (no daylight saving), which Brisbane
 * observes, so instants are shown in that zone whatever the browser's.
 */

const numberFormats = new Map<number, Intl.NumberFormat>();

export function formatNumber(value: number, fractionDigits = 0): string {
  let format = numberFormats.get(fractionDigits);
  if (!format) {
    format = new Intl.NumberFormat('en-AU', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
    numberFormats.set(fractionDigits, format);
  }
  return format.format(value);
}

const instantFormat = new Intl.DateTimeFormat('en-AU', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'Australia/Brisbane',
});

const dateFormat = new Intl.DateTimeFormat('en-AU', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

const monthFormat = new Intl.DateTimeFormat('en-AU', { month: 'short', timeZone: 'UTC' });

/** An instant as `31 Oct 2026 10:42` (AEST). */
export function formatInstant(iso: string): string {
  return instantFormat.format(new Date(iso)).replace(',', '');
}

/** The AEST trading day of an instant, as `YYYY-MM-DD`. */
export function aestDay(iso: string): string {
  return new Date(new Date(iso).getTime() + 10 * 3_600_000).toISOString().slice(0, 10);
}

/** An ISO date (`YYYY-MM-DD`) as `1 Jan 2027`. */
export function formatDate(isoDate: string): string {
  return dateFormat.format(new Date(`${isoDate}T00:00:00Z`));
}

/** An expiry as `Mar 2027`. */
export function formatExpiry(month: number, year: number): string {
  return `${monthFormat.format(new Date(Date.UTC(year, month - 1, 1)))} ${year}`;
}
