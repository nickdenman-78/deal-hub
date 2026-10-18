import { nextTick } from 'vue';
import { afterEach, describe, expect, it } from 'vitest';
import { usePersistedTreeExpansion } from './usePersistedTreeExpansion';

const PREFIX = 'test.';
const KEY = 'catalog';
const STORAGE_KEY = `${PREFIX}expanded-tree-keys.${KEY}`;

afterEach(() => {
  window.localStorage.clear();
});

describe('usePersistedTreeExpansion', () => {
  it('restores a persisted array and trims it to keys that still exist', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(['a', 'gone']));
    const { expanded, reconcile } = usePersistedTreeExpansion(KEY, { storagePrefix: PREFIX });

    expect(expanded.value).toEqual(['a', 'gone']);
    reconcile(new Set(['a', 'b']));
    expect(expanded.value).toEqual(['a']);
  });

  /* The app-side original persisted Record<string, boolean> under this same
     key; the switch to the array shape must not reset operators' state. */
  it('migrates the legacy Record payload, truthy keys only', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ a: true, b: false, c: true }));
    const { expanded } = usePersistedTreeExpansion(KEY, { storagePrefix: PREFIX });

    expect(expanded.value).toEqual(['a', 'c']);
  });

  it('defers first reconcile until data arrives, so restore survives the immediate watcher', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(['a']));
    const { expanded, reconcile } = usePersistedTreeExpansion(KEY, { storagePrefix: PREFIX });

    reconcile(new Set()); // the immediate:true firing before any load resolves
    expect(expanded.value).toEqual(['a']);

    reconcile(new Set(['a', 'b']));
    expect(expanded.value).toEqual(['a']); // restored, b NOT forced open
  });

  it('auto-expands branches minted during the session and drops vanished ones', () => {
    const { expanded, reconcile } = usePersistedTreeExpansion(KEY, { storagePrefix: PREFIX });

    reconcile(new Set(['a']));
    reconcile(new Set(['a', 'new']));
    expect(expanded.value).toContain('new');

    reconcile(new Set(['new']));
    expect(expanded.value).toEqual(['new']);
  });

  it('does not re-open a deliberately collapsed branch on the next reconcile', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    const { expanded, reconcile } = usePersistedTreeExpansion(KEY, { storagePrefix: PREFIX });

    reconcile(new Set(['a', 'b'])); // first: a and b exist, both collapsed by choice
    reconcile(new Set(['a', 'b'])); // second: nothing new — nothing may open
    expect(expanded.value).toEqual([]);
  });

  it('persists writes and tolerates corrupt payloads', async () => {
    const { expanded } = usePersistedTreeExpansion(KEY, { storagePrefix: PREFIX });
    expanded.value = ['x'];
    await nextTick();
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!)).toEqual(['x']);

    window.localStorage.setItem(STORAGE_KEY, '{not json');
    const second = usePersistedTreeExpansion(KEY, { storagePrefix: PREFIX });
    expect(second.expanded.value).toEqual([]);
  });
});
