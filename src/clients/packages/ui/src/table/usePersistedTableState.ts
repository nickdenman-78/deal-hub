import { ref, watch, type Ref } from 'vue';
import { isDataTableDensity, type DataTableDensity } from './types';

/**
 * A table's whole view state under one key, rather than one key per concern.
 *
 * `usePersistedTableDensity` and `usePersistedRowGroups` already existed and
 * each own a key of their own. That was fine while density was the only thing
 * worth remembering; it stops being fine once a screen also remembers its
 * columns, its sort and its page size, because "restore this table" becomes
 * four reads that can half-succeed — a table that comes back with your columns
 * but not your sort looks broken in a way nobody can describe.
 *
 * One record, one read, one write.
 *
 * Deliberately NOT persisted: the free-text search and the column filters. A
 * filter that survives a reload hides rows the operator did not hide, and the
 * first thing they see is an empty table with no visible cause. Density,
 * columns, sort and page size are preferences; a filter is a question you asked
 * once.
 */
export interface TableState {
  /** Column ids currently shown, in table order. */
  columns?: string[];
  sortBy?: string | null;
  sortDesc?: boolean;
  density?: DataTableDensity;
  pageSize?: number;
}

export interface PersistedTableState {
  state: Ref<TableState>;
  /**
   * False until the stored value has been read. A table that renders its
   * defaults and then snaps to the stored state one tick later reads as a
   * glitch; gate the table on this and it renders once, correctly.
   */
  hydrated: Ref<boolean>;
  /** Forget the stored state and return to the defaults. */
  reset: () => void;
}

const PREFIX = 'ets.table.';

/**
 * Storage can throw rather than merely fail: Safari in private browsing throws
 * on `setItem`, and an embedded frame with third-party storage blocked throws
 * on `localStorage` itself. Both are caught here so a preference can never take
 * a screen down with it.
 */
function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* A preference that cannot be saved is not worth an error. */
  }
}

function removeRaw(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* As above. */
  }
}

/**
 * Only the keys we recognise, and only when the stored type matches. A payload
 * written by an older build — or edited by hand — must not be able to put a
 * table into a state its own props cannot express.
 */
function sanitise(raw: unknown, valid: readonly string[]): TableState {
  if (!raw || typeof raw !== 'object') return {};
  const value = raw as Record<string, unknown>;
  const out: TableState = {};

  if (Array.isArray(value.columns)) {
    const known = value.columns.filter((id): id is string => typeof id === 'string' && valid.includes(id));
    // An empty result means every stored column has since been renamed or
    // removed. Restoring it would show a table with no columns at all, so the
    // caller's defaults are the better answer.
    if (known.length > 0) out.columns = known;
  }
  if (typeof value.sortBy === 'string' || value.sortBy === null) out.sortBy = value.sortBy;
  if (typeof value.sortDesc === 'boolean') out.sortDesc = value.sortDesc;
  // The package's own guard, not a repeated literal union — a fourth density
  // added to types.ts must not silently fail to restore here.
  if (isDataTableDensity(value.density)) out.density = value.density;
  if (typeof value.pageSize === 'number' && Number.isFinite(value.pageSize) && value.pageSize > 0) {
    out.pageSize = value.pageSize;
  }
  return out;
}

/**
 * @param key      Screen-scoped, e.g. `'retail-deals'`. Prefixed on write.
 * @param defaults Applied under whatever was stored.
 * @param columnIds Every column id the table can show. Stored ids outside this
 *                  list are dropped, so a renamed column cannot resurrect
 *                  itself or hide a real one.
 */
export function usePersistedTableState(
  key: string,
  defaults: TableState = {},
  columnIds: readonly string[] = [],
): PersistedTableState {
  const storageKey = `${PREFIX}${key}`;
  const state = ref<TableState>({ ...defaults });
  const hydrated = ref(false);

  const stored = readRaw(storageKey);
  if (stored) {
    try {
      state.value = { ...defaults, ...sanitise(JSON.parse(stored), columnIds) };
    } catch {
      // Corrupt payload: drop it rather than carry it forward, so the next
      // write starts from something parseable.
      removeRaw(storageKey);
    }
  }
  hydrated.value = true;

  watch(
    state,
    (value) => {
      if (!hydrated.value) return;
      writeRaw(storageKey, JSON.stringify(value));
    },
    { deep: true },
  );

  function reset(): void {
    removeRaw(storageKey);
    state.value = { ...defaults };
  }

  return { state, hydrated, reset };
}
