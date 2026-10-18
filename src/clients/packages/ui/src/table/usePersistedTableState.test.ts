import { beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick } from 'vue';
import { usePersistedTableState } from './usePersistedTableState';

/*
 * Storage is faked rather than borrowed from the environment.
 *
 * jsdom supplies a real `window.localStorage`, but Node 26 ships an
 * experimental global `localStorage` that shadows it and is inert without
 * `--localstorage-file` — so on Node 26 `window.localStorage` is `undefined`
 * and every assertion here would fail for a reason that has nothing to do with
 * this composable. (That is also what fails the six pre-existing persistence
 * suites in this package; they read the environment's storage directly.)
 *
 * A fake costs nothing, says exactly what was written, and passes on every
 * Node.
 */
const KEY = 'ets.table.deals';
const COLUMNS = ['reference', 'name', 'consortium'];

function fakeStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() {
      return map.size;
    },
  };
}

let storage: ReturnType<typeof fakeStorage>;

function run<T>(fn: () => T): T {
  // A composable that registers a watcher needs an owner, or the write-back
  // never fires and every persistence assertion passes for the wrong reason.
  const scope = effectScope();
  return scope.run(fn) as T;
}

beforeEach(() => {
  vi.unstubAllGlobals();
  storage = fakeStorage();
  vi.stubGlobal('localStorage', storage);
});

describe('restore', () => {
  it('starts from the defaults when nothing is stored', () => {
    const { state, hydrated } = run(() => usePersistedTableState('deals', { density: 'compact' }, COLUMNS));
    expect(state.value.density).toBe('compact');
    expect(hydrated.value).toBe(true);
  });

  it('reads a stored state back', () => {
    storage.setItem(KEY, JSON.stringify({ density: 'comfortable', pageSize: 50 }));
    const { state } = run(() => usePersistedTableState('deals', { density: 'compact' }, COLUMNS));
    expect(state.value.density).toBe('comfortable');
    expect(state.value.pageSize).toBe(50);
  });

  it('layers the stored state over the defaults rather than replacing them', () => {
    storage.setItem(KEY, JSON.stringify({ pageSize: 50 }));
    const { state } = run(() => usePersistedTableState('deals', { density: 'compact' }, COLUMNS));
    expect(state.value).toEqual({ density: 'compact', pageSize: 50 });
  });

  it('drops a stored column that no longer exists', () => {
    // A renamed column must not resurrect itself, nor hide a real one.
    storage.setItem(KEY, JSON.stringify({ columns: ['reference', 'gone'] }));
    const { state } = run(() => usePersistedTableState('deals', {}, COLUMNS));
    expect(state.value.columns).toEqual(['reference']);
  });

  it('falls back to the defaults when every stored column has gone', () => {
    // Restoring an empty list would render a table with no columns at all.
    storage.setItem(KEY, JSON.stringify({ columns: ['gone', 'also-gone'] }));
    const { state } = run(() => usePersistedTableState('deals', { columns: ['reference'] }, COLUMNS));
    expect(state.value.columns).toEqual(['reference']);
  });

  it('ignores a value of the wrong type', () => {
    storage.setItem(KEY, JSON.stringify({ pageSize: 'lots', sortDesc: 'yes' }));
    const { state } = run(() => usePersistedTableState('deals', {}, COLUMNS));
    expect(state.value.pageSize).toBeUndefined();
    expect(state.value.sortDesc).toBeUndefined();
  });

  it('ignores a density outside the union', () => {
    storage.setItem(KEY, JSON.stringify({ density: 'enormous' }));
    const { state } = run(() => usePersistedTableState('deals', { density: 'compact' }, COLUMNS));
    expect(state.value.density).toBe('compact');
  });

  it('ignores a corrupt payload and clears it', () => {
    storage.setItem(KEY, '{not json');
    const { state } = run(() => usePersistedTableState('deals', { density: 'compact' }, COLUMNS));
    expect(state.value.density).toBe('compact');
    expect(storage.getItem(KEY)).toBeNull();
  });

  it('survives storage being unavailable entirely', () => {
    // Safari in private browsing throws on access, not just on write.
    vi.stubGlobal('localStorage', {
      get getItem() {
        throw new Error('denied');
      },
    });
    expect(() => run(() => usePersistedTableState('deals', { density: 'compact' }, COLUMNS))).not.toThrow();
  });
});

describe('persist', () => {
  it('writes the whole state under one key', async () => {
    const { state } = run(() => usePersistedTableState('deals', {}, COLUMNS));
    state.value.density = 'comfortable';
    state.value.pageSize = 25;
    await nextTick();

    const stored = JSON.parse(storage.getItem(KEY) ?? '{}');
    expect(stored).toEqual({ density: 'comfortable', pageSize: 25 });
  });

  it('writes on a nested change, not only on replacement', async () => {
    const { state } = run(() => usePersistedTableState('deals', { columns: ['reference'] }, COLUMNS));
    state.value.columns?.push('name');
    await nextTick();
    expect(JSON.parse(storage.getItem(KEY) ?? '{}').columns).toEqual(['reference', 'name']);
  });

  it('does not throw when storage refuses the write', async () => {
    const { state } = run(() => usePersistedTableState('deals', {}, COLUMNS));
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota');
      },
      removeItem: () => undefined,
    });
    state.value.density = 'comfortable';
    await expect(nextTick()).resolves.not.toThrow();
  });
});

describe('reset', () => {
  it('forgets the stored state and returns to the defaults', async () => {
    storage.setItem(KEY, JSON.stringify({ density: 'comfortable' }));
    const { state, reset } = run(() => usePersistedTableState('deals', { density: 'compact' }, COLUMNS));
    expect(state.value.density).toBe('comfortable');

    reset();
    expect(state.value.density).toBe('compact');
  });
});
