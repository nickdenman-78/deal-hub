/**
 * Maps a time input's ValidityState into operator-facing copy.
 *
 * Empty is deliberately not an error here — `required` is for submit time.
 * Impossible times arrive as `badInput`; min/max as range flags.
 */
export function timeValidityMessage(
  validity: Pick<ValidityState, 'badInput' | 'rangeUnderflow' | 'rangeOverflow'>,
  bounds: { min?: string; max?: string } = {},
): string | null {
  if (validity.badInput) return 'Enter a valid time.';
  if (validity.rangeUnderflow && bounds.min) return `Must be on or after ${formatBound(bounds.min)}.`;
  if (validity.rangeOverflow && bounds.max) return `Must be on or before ${formatBound(bounds.max)}.`;
  return null;
}

/** Locale display for min/max copy — `HH:mm` / `HH:mm:ss` stays on the wire. */
function formatBound(time: string): string {
  const parts = time.split(':').map(Number);
  if (parts.length < 2 || parts.some((n) => Number.isNaN(n))) return time;
  const [hours = 0, minutes = 0, seconds = 0] = parts;
  return new Date(1970, 0, 1, hours, minutes, seconds).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    ...(parts.length > 2 ? { second: '2-digit' } : {}),
  });
}
