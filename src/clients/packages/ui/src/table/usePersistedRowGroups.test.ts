import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick } from 'vue';
import { usePersistedRowGroups } from './usePersistedRowGroups';

/*
 * The reconcile contract has three rules that are easy to get backwards, and
 * each one fails in a way an operator would report as "it forgot my layout"
 * rather than as a bug:
 *
 *   1. the first call, if data has not arrived, must do NOTHING;
 *   2. the first real call must honour what was restored, without opening
 *      anything;
 *   3. only groups that appeared AFTER that point open by themselves.
 */
const PREFIX = 'test-app.';
const KEY = `${PREFIX}expanded-row-groups.services`;

let scope: ReturnType<typeof effectScope>;

function create(prefix = PREFIX) {
  return scope.run(() => usePersistedRowGroups('services', { storagePrefix: prefix }))!;
}

beforeEach(() => {
  window.localStorage.clear();
  scope = effectScope();
});

afterEach(() => {
  scope.stop();
  vi.unstubAllGlobals();
});

describe('restore', () => {
  it('reads the persisted array on creation', () => {
    window.localStorage.setItem(KEY, JSON.stringify(['apis', 'databases']));
    expect(create().expanded.value).toEqual(['apis', 'databases']);
  });

  it('writes under the supplied prefix', async () => {
    const { expanded } = create();
    expanded.value = ['apis'];
    await nextTick();

    expect(window.localStorage.getItem(KEY)).toBe('["apis"]');
  });

  it('defaults to the ets. prefix when none is given', async () => {
    const { expanded } = scope.run(() => usePersistedRowGroups('services'))!;
    expanded.value = ['apis'];
    await nextTick();

    expect(window.localStorage.getItem('ets.expanded-row-groups.services')).toBe('["apis"]');
  });

  it('ignores a corrupt or wrongly-typed payload', () => {
    window.localStorage.setItem(KEY, '{ not json');
    expect(create().expanded.value).toEqual([]);

    window.localStorage.setItem(KEY, JSON.stringify({ apis: true }));
    expect(create().expanded.value).toEqual([]);

    window.localStorage.setItem(KEY, JSON.stringify(['apis', 7]));
    expect(create().expanded.value).toEqual([]);
  });

  it('survives storage being unavailable entirely', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    });

    expect(() => {
      const { expanded } = create();
      expanded.value = ['apis'];
    }).not.toThrow();
  });
});

describe('reconcile', () => {
  it('does nothing on an empty first call, so restored state is not wiped', () => {
    window.localStorage.setItem(KEY, JSON.stringify(['apis']));
    const { expanded, reconcile } = create();

    // This is what an `immediate: true` watcher fires before the fetch resolves.
    reconcile(new Set());

    expect(expanded.value).toEqual(['apis']);
  });

  it('honours the restored set on the first real call without opening anything', () => {
    window.localStorage.setItem(KEY, JSON.stringify(['apis']));
    const { expanded, reconcile } = create();

    reconcile(new Set(['apis', 'databases', 'queues']));

    // 'databases' and 'queues' existed before this session — they stay shut.
    expect(expanded.value).toEqual(['apis']);
  });

  it('drops groups that have vanished from the data', () => {
    window.localStorage.setItem(KEY, JSON.stringify(['apis', 'retired']));
    const { expanded, reconcile } = create();

    reconcile(new Set(['apis']));

    expect(expanded.value).toEqual(['apis']);
  });

  it('auto-opens a group minted after the first reconcile', () => {
    const { expanded, reconcile } = create();

    reconcile(new Set(['apis']));
    expect(expanded.value).toEqual([]);

    reconcile(new Set(['apis', 'brand-new']));
    expect(expanded.value).toEqual(['brand-new']);
  });

  it('does not re-open a group the operator collapsed', () => {
    window.localStorage.setItem(KEY, JSON.stringify(['apis']));
    const { expanded, reconcile } = create();

    reconcile(new Set(['apis', 'databases']));
    expanded.value = []; // operator collapses everything

    reconcile(new Set(['apis', 'databases']));

    // Both were seeded into `seen` on the first pass, so neither counts as new.
    expect(expanded.value).toEqual([]);
  });

  it('treats a group that vanished and came back as new, and opens it', () => {
    window.localStorage.setItem(KEY, JSON.stringify(['apis']));
    const { expanded, reconcile } = create();

    reconcile(new Set(['apis', 'databases']));
    reconcile(new Set(['databases'])); // every service in 'apis' is gone
    expect(expanded.value).toEqual([]);

    reconcile(new Set(['apis', 'databases'])); // and one comes back

    /*
     * Pinned deliberately, because it looks like a bug and is not: `seen` is
     * replaced each pass rather than accumulated, so an empty-then-repopulated
     * group counts as newly-appeared and opens.
     *
     * That is the behaviour we want. The alternative — remembering every group
     * ever seen — would leave a category the operator has just re-populated
     * collapsed and easy to miss. It is safe here because callers reconcile
     * against the UNFILTERED set (see ServicesView, which watches `bucketed`,
     * not `filteredBucketed`), so typing in a filter box cannot trigger it.
     */
    expect(expanded.value).toEqual(['apis']);
  });
});
