import { ref, watch, type Ref } from 'vue';
import { isDataTableDensity, type DataTableDensity } from './types';

/**
 * localStorage-backed density for `DataTable`'s `density` prop.
 *
 * The persistence half of a contract the package already owns: `DataTable`
 * exposes density as a model rather than keeping it private, and
 * `TableDensityMenu` is the CommandRail presentation. This is the answer to
 * "where the value lives", offered once so every table remembers itself the
 * same way.
 *
 * Pinia-free on purpose — density is view state, not application state.
 */
export interface PersistedTableDensityOptions {
  /**
   * localStorage key prefix.
   *
   * An app adopting this MUST pass the prefix it already writes under, or every
   * operator's saved density silently resets on first load — the same trap
   * `usePersistedRowGroups`' `storagePrefix` note records. config-admin's is
   * `retail-config-server.`.
   */
  storagePrefix?: string;
  /** Used when nothing is stored, or the stored value is not a density. */
  defaultValue?: DataTableDensity;
  /**
   * Full localStorage key. When set, `key` and `storagePrefix` are ignored.
   * Use when adopting this composable over a key the view already wrote.
   */
  storageKey?: string;
}

const DEFAULT_PREFIX = 'ets.';
const DEFAULT_DENSITY: DataTableDensity = 'standard';

export function usePersistedTableDensity(
  key: string,
  options: PersistedTableDensityOptions = {},
): Ref<DataTableDensity> {
  const storageKey = options.storageKey ?? `${options.storagePrefix ?? DEFAULT_PREFIX}table-density.${key}`;
  const fallback = options.defaultValue ?? DEFAULT_DENSITY;

  function read(): DataTableDensity {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (isDataTableDensity(raw)) return raw;
    } catch {
      // Storage disabled or quota. Persistence is a convenience; losing it
      // must never break the table.
    }
    return fallback;
  }

  function write(value: DataTableDensity) {
    try {
      window.localStorage.setItem(storageKey, value);
    } catch {
      // Same — silently drop.
    }
  }

  const density = ref<DataTableDensity>(read());
  watch(density, (next) => write(next));
  return density;
}
