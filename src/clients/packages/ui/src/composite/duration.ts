/*
 * Duration parsing and formatting — `30s`, `2h30m`, `1d12h`, `500ms`. Pure, so
 * the arithmetic and the awkward inputs are testable without mounting anything.
 *
 * The shape follows Go's `time.ParseDuration`, because that is what the config
 * files this feeds already contain and what most of the services reading them
 * expect. Two deliberate departures, both because these are OPERATOR-facing
 * config values rather than program literals:
 *
 *   `d` IS a unit. Go leaves it out — correctly, since a calendar day is not
 *   always 24 hours — but "1d" in a retention or timeout setting means 24 hours
 *   to everyone who writes it, and making them type "24h" does not make it more
 *   true. It is defined as exactly 24h here; anything that needs real calendar
 *   arithmetic wants a date library, not a duration field.
 *
 *   A BARE NUMBER IS REJECTED. "30" is thirty of something and the something is
 *   the whole question — seconds to one service, milliseconds to the next. A
 *   field that guesses is a field that silently sets a timeout a thousand times
 *   too long. DurationInput can offer a unit for a bare number, but that is an
 *   explicit choice at the call site, not a default hidden in the parser.
 */

export type DurationUnit = 'ms' | 's' | 'm' | 'h' | 'd';

/** Milliseconds per unit. Longest-first, which is also the canonical order. */
export const DURATION_UNITS: readonly { unit: DurationUnit; ms: number; label: string }[] = Object.freeze([
  { unit: 'd', ms: 86_400_000, label: 'days' },
  { unit: 'h', ms: 3_600_000, label: 'hours' },
  { unit: 'm', ms: 60_000, label: 'minutes' },
  { unit: 's', ms: 1000, label: 'seconds' },
  { unit: 'ms', ms: 1, label: 'milliseconds' },
]);

const MS_PER: Record<DurationUnit, number> = {
  d: 86_400_000,
  h: 3_600_000,
  m: 60_000,
  s: 1000,
  ms: 1,
};

/*
 * One `<number><unit>` term. `ms` must be tried before `m`, which the
 * alternation order handles — a regex is not ordered by length, so `m|ms` would
 * match the `m` of `500ms` and leave a stray `s` to fail the next round.
 */
const TERM = /(\d+(?:\.\d+)?)(ms|s|m|h|d)/y;

/**
 * Parses a duration into milliseconds, or null if it is not one.
 *
 * Strict on purpose — it never half-accepts a partially-typed value, so a
 * caller can use `null` to mean "not valid yet" without a second check.
 * Whitespace between terms is tolerated (`2h 30m`), because operators type it
 * and rejecting it teaches nothing.
 */
export function parseDuration(raw: string | null | undefined): number | null {
  if (typeof raw !== 'string') return null;

  const text = raw.trim().toLowerCase().replace(/\s+/g, '');
  if (text === '') return null;
  if (text === '0') return 0; // The one bare number that is unambiguous.

  TERM.lastIndex = 0;
  let total = 0;
  let matched = 0;

  while (TERM.lastIndex < text.length) {
    const match = TERM.exec(text);
    if (!match) return null;
    const [, amount, unit] = match;
    total += Number(amount) * MS_PER[unit as DurationUnit];
    matched += 1;
  }

  if (matched === 0) return null;
  if (!Number.isFinite(total) || total > Number.MAX_SAFE_INTEGER) return null;

  // Sub-millisecond precision cannot survive the round trip, so a value that
  // would need it is not representable rather than quietly truncated.
  return Number.isInteger(total) ? total : Math.round(total);
}

export function isValidDuration(raw: string | null | undefined): boolean {
  return parseDuration(raw) !== null;
}

/**
 * Milliseconds → the canonical string: largest unit first, zero terms omitted.
 *
 * `0` formats as `0s` rather than an empty string — a duration field showing
 * nothing reads as unset, and unset and zero are different answers.
 */
export function formatDuration(ms: number, options?: { units?: readonly DurationUnit[] }): string {
  if (!Number.isFinite(ms) || ms < 0) return '';
  if (ms === 0) return '0s';

  const allowed = options?.units;
  const scale = DURATION_UNITS.filter((entry) => allowed === undefined || allowed.includes(entry.unit));
  if (scale.length === 0) return '';

  let remaining = Math.round(ms);
  const parts: string[] = [];

  for (const entry of scale) {
    const count = Math.floor(remaining / entry.ms);
    if (count > 0) {
      parts.push(`${count}${entry.unit}`);
      remaining -= count * entry.ms;
    }
  }

  /*
   * A remainder the allowed units cannot express — 90s with only `m` available.
   * Rounding it away would report a different duration than the one held, so
   * the smallest allowed unit absorbs it as a fraction instead.
   */
  if (remaining > 0) {
    const smallest = scale[scale.length - 1];
    if (smallest) {
      const fraction = Number((remaining / smallest.ms).toFixed(3));
      if (fraction > 0) parts.push(`${fraction}${smallest.unit}`);
    }
  }

  return parts.length > 0 ? parts.join('') : '0s';
}

/** Round-trips a value into canonical form, or returns it untouched if it is not valid. */
export function normalizeDuration(raw: string): string {
  const ms = parseDuration(raw);
  return ms === null ? raw : formatDuration(ms);
}

/**
 * A human sentence for the field's hint line — "2 hours 30 minutes".
 *
 * Separate from `formatDuration` because they answer different questions: one
 * is the value that gets stored, the other is the reassurance that it means
 * what the operator thought.
 */
export function describeDuration(ms: number | null): string {
  if (ms === null || !Number.isFinite(ms) || ms < 0) return '';
  if (ms === 0) return 'none';

  let remaining = Math.round(ms);
  const parts: string[] = [];

  for (const entry of DURATION_UNITS) {
    const count = Math.floor(remaining / entry.ms);
    if (count === 0) continue;
    const label = count === 1 ? entry.label.replace(/s$/, '') : entry.label;
    parts.push(`${count} ${label}`);
    remaining -= count * entry.ms;
  }

  return parts.join(' ');
}

/** Why a value is not acceptable, or undefined when it is. */
export function durationError(
  raw: string,
  constraints?: { min?: number; max?: number; required?: boolean },
): string | undefined {
  const text = raw.trim();
  if (text === '') return constraints?.required === true ? 'Required.' : undefined;

  const ms = parseDuration(text);
  if (ms === null) return 'Use a number and a unit, like 30s or 2h30m.';
  if (constraints?.min !== undefined && ms < constraints.min) return `Minimum is ${formatDuration(constraints.min)}.`;
  if (constraints?.max !== undefined && ms > constraints.max) return `Maximum is ${formatDuration(constraints.max)}.`;
  return undefined;
}
