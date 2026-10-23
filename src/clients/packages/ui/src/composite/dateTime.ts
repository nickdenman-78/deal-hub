/**
 * Split / join for `yyyy-mm-ddTHH:mm` (and optional seconds) — the same shape
 * `input type="datetime-local"` speaks, without a timezone.
 */

export type DateTimeParts = {
  date: string | undefined;
  time: string | undefined;
};

export function splitDateTime(value: string | undefined | null): DateTimeParts {
  if (value == null || value === '') return { date: undefined, time: undefined };
  const separator = value.indexOf('T');
  if (separator === -1) {
    // Date-only — treat as date with no time yet.
    return { date: value, time: undefined };
  }
  const date = value.slice(0, separator);
  const time = value.slice(separator + 1);
  return {
    date: date === '' ? undefined : date,
    time: time === '' ? undefined : time,
  };
}

/**
 * Compose a datetime-local string. No date → undefined (incomplete).
 * Date without time → midnight (`00:00` / `00:00:00`).
 */
export function joinDateTime(
  date: string | undefined,
  time: string | undefined,
  withSeconds = false,
): string | undefined {
  if (!date) return undefined;
  const fallback = withSeconds ? '00:00:00' : '00:00';
  return `${date}T${time && time.length > 0 ? time : fallback}`;
}

/** Date half of a datetime-local min/max bound. */
export function boundDate(bound: string | undefined): string | undefined {
  if (!bound) return undefined;
  return splitDateTime(bound).date;
}

/**
 * Time half of a datetime min/max, only when `selectedDate` is on that bound's
 * calendar day — otherwise the time field is unconstrained by this bound.
 */
export function boundTime(bound: string | undefined, selectedDate: string | undefined): string | undefined {
  if (!bound || !selectedDate) return undefined;
  const { date, time } = splitDateTime(bound);
  return date === selectedDate ? time : undefined;
}
