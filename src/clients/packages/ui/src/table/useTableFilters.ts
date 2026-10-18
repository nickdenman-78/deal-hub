import { computed, reactive, type ComputedRef } from 'vue';

/**
 * A screen's filter values as one record, so "is anything filtered" and "clear
 * everything" are derived rather than maintained.
 *
 * Written by hand, those two are a second list of the filters that has to be
 * kept in step with the first — and both fail quietly when it is not. A filter
 * missing from the count leaves the "Clear filters" control hidden while the
 * table is filtered; one missing from the reset survives the clear, and the
 * operator is left looking at a narrowed table with every control saying it is
 * not narrowing anything.
 *
 * Active means **differs from its default**, not "is truthy". An `includeExpired`
 * that defaults to `false` is filtering when it is `true`; a status filter that
 * defaults to `'open'` is filtering when it is anything else. Truthiness gets
 * both of those wrong.
 */

/** Structural equality for the shapes a filter holds: primitives, arrays, flat records. */
function same(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || a === undefined || b === undefined) return false;

  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((item, i) => same(item, b[i]));
  }

  if (typeof a === 'object' && typeof b === 'object') {
    // A DateRange is `{ from?, to? }`, so `{}`, `{ from: undefined }` and a
    // range cleared back to empty must all read as the same value.
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    return [...keys].every((key) => same((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]));
  }

  return false;
}

export interface TableFilters<T extends Record<string, unknown>> {
  /** The live values. Bind controls straight to these. */
  values: T;
  /** How many filters differ from their default. */
  activeCount: ComputedRef<number>;
  /** Whether anything is narrowing the table. */
  active: ComputedRef<boolean>;
  /** Which keys are filtering, for a caller that wants to name them. */
  activeKeys: ComputedRef<(keyof T)[]>;
  /** Back to the defaults, every key, in one call. */
  clear: () => void;
}

/**
 * @param defaults The unfiltered state. Cloned, so the caller's object is not
 *                 mutated and `clear()` cannot drift from what it restores.
 */
export function useTableFilters<T extends Record<string, unknown>>(defaults: T): TableFilters<T> {
  const initial = structuredClone(defaults);
  const values = reactive(structuredClone(defaults)) as T;

  const activeKeys = computed(() =>
    (Object.keys(initial) as (keyof T)[]).filter((key) => !same(values[key], initial[key])),
  );

  function clear(): void {
    const fresh = structuredClone(initial);
    for (const key of Object.keys(initial) as (keyof T)[]) {
      values[key] = fresh[key];
    }
  }

  return {
    values,
    activeKeys,
    activeCount: computed(() => activeKeys.value.length),
    active: computed(() => activeKeys.value.length > 0),
    clear,
  };
}

/**
 * The distinct values a column offers, sorted, for populating a filter's
 * options.
 *
 * Built from every row the screen was given rather than the filtered ones, so
 * choosing one value does not empty out the other filters' lists. `current` is
 * folded in even when no row carries it any more: a filter that has outlived
 * its rows would otherwise drop off the list and leave the control reading as
 * unset while the table sits empty.
 */
export function distinctFilterOptions(
  values: readonly (string | null | undefined)[],
  current: string | readonly string[] = '',
): string[] {
  const found = new Set(values.filter((value): value is string => !!value));
  for (const value of typeof current === 'string' ? [current] : current) {
    if (value) found.add(value);
  }
  return [...found].sort((a, b) => a.localeCompare(b));
}
