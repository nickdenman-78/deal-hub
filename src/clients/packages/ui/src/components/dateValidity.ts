/**
 * Maps a date input's ValidityState and optional availability rules into
 * operator-facing copy.
 *
 * Empty is deliberately not an error here — `required` is for submit time.
 * Impossible dates (31 June) arrive as `badInput`; min/max as range flags.
 * Weekdays / holiday lists are ours — the native chooser cannot grey them out,
 * so rejection is post-selection via the field error.
 */

/** `Date#getDay` values: 0 = Sunday … 6 = Saturday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Convenience for business-day fields. */
export const WEEKEND_DAYS: readonly Weekday[] = [0, 6];

export type DateAvailability = {
  /**
   * Days of the week that cannot be chosen (`Date#getDay`: 0 = Sunday …
   * 6 = Saturday). Use `WEEKEND_DAYS` for Sat/Sun.
   */
  disabledWeekdays?: readonly Weekday[];
  /** ISO `yyyy-mm-dd` dates that cannot be chosen (holidays, closures). */
  disabledDates?: readonly string[];
};

export function dateValidityMessage(
  validity: Pick<ValidityState, 'badInput' | 'rangeUnderflow' | 'rangeOverflow'>,
  bounds: { min?: string; max?: string } = {},
): string | null {
  if (validity.badInput) return 'Enter a valid calendar date.';
  if (validity.rangeUnderflow && bounds.min) return `Must be on or after ${formatBound(bounds.min)}.`;
  if (validity.rangeOverflow && bounds.max) return `Must be on or before ${formatBound(bounds.max)}.`;
  return null;
}

/**
 * Rejects a committed ISO date against weekday / holiday rules.
 * Call after native ValidityState is clean — badInput has no ISO value.
 */
export function dateAvailabilityMessage(iso: string | undefined, availability: DateAvailability = {}): string | null {
  if (!iso) return null;
  const parts = parseIsoDate(iso);
  if (!parts) return null;

  if (availability.disabledDates?.includes(iso)) {
    return 'This date is unavailable.';
  }

  const weekdays = availability.disabledWeekdays;
  if (weekdays && weekdays.length > 0) {
    const day = new Date(parts.year, parts.month - 1, parts.day).getDay() as Weekday;
    if (weekdays.includes(day)) return weekdayUnavailableMessage(weekdays);
  }

  return null;
}

function weekdayUnavailableMessage(disabled: readonly Weekday[]): string {
  const unique = [...new Set(disabled)];
  if (unique.length === 2 && unique.includes(0) && unique.includes(6)) {
    return 'Weekends are not available.';
  }
  if (unique.length === 1) {
    return `${WEEKDAY_NAMES[unique[0]!]}s are not available.`;
  }
  return 'This day of the week is unavailable.';
}

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

/** Locale display for min/max copy — ISO stays on the wire. */
function formatBound(iso: string): string {
  const parts = parseIsoDate(iso);
  if (!parts) return iso;
  return new Date(parts.year, parts.month - 1, parts.day).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function parseIsoDate(iso: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}
