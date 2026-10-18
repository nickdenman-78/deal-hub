/*
 * Timestamp presentation.
 *
 * Every timestamp the APIs return is an RFC-3339 UTC string; these render it in
 * the operator's LOCAL timezone, so an audit trail lines up with the wall clock
 * of whoever is reading it.
 *
 * This is design-system vocabulary, not a utility: `"5s ago"` is product voice,
 * and `yyyy-MM-dd HH:mm` is a chosen format rather than a locale default —
 * chosen because it sorts lexicographically and is unambiguous to a reader who
 * might otherwise have to guess whether 03/04 is March or April. Two apps
 * disagreeing about either is a visible inconsistency, which is what puts these
 * here rather than in each app's own lib/.
 *
 * `Intl.DateTimeFormat` is deliberately NOT used. It would hand format control
 * to the operator's locale, which is exactly what we do not want: an ISO-shaped
 * stamp is the format, everywhere.
 */

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

/**
 * `yyyy-MM-dd HH:mm:ss`, local. For places where second-level precision earns
 * its width — an audit log, an "updated by … at …" line.
 *
 * An unparseable input is returned VERBATIM rather than as "Invalid Date". If a
 * server ever sends something unexpected, showing the raw value gives whoever
 * is looking at it something to search for.
 */
export function formatLocalDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

/** `yyyy-MM-dd HH:mm`, local. For lists, where seconds are noise. */
export function formatLocalDateTimeShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` + `${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

/**
 * `5s ago` / `12m ago` / `3h ago` / `2d ago`.
 *
 * Returns EMPTY for an unparseable input, unlike the two formatters above:
 * callers pair this with an absolute stamp, so the absolute form stays visible
 * and a relative age of "" simply drops out rather than printing a placeholder
 * beside a value that is already on screen.
 */
export function relativeAge(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const diffMs = Date.now() - d.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}
