import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick } from 'vue';
import { usePersistedTableDensity } from './usePersistedTableDensity';

const PREFIX = 'test-app.';
const KEY = `${PREFIX}table-density.environments`;

let scope: ReturnType<typeof effectScope>;

function create(prefix = PREFIX, defaultValue?: 'compact' | 'standard' | 'comfortable') {
  return scope.run(() => usePersistedTableDensity('environments', { storagePrefix: prefix, defaultValue }))!;
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
  it('reads a persisted density on creation', () => {
    window.localStorage.setItem(KEY, 'comfortable');
    expect(create().value).toBe('comfortable');
  });

  it('writes under the supplied prefix', async () => {
    const density = create();
    density.value = 'compact';
    await nextTick();

    expect(window.localStorage.getItem(KEY)).toBe('compact');
  });

  it('defaults to the ets. prefix and standard density when none are given', async () => {
    const density = scope.run(() => usePersistedTableDensity('services'))!;
    expect(density.value).toBe('standard');

    density.value = 'comfortable';
    await nextTick();

    expect(window.localStorage.getItem('ets.table-density.services')).toBe('comfortable');
  });

  it('honours an explicit storageKey so an existing view key is not abandoned', async () => {
    window.localStorage.setItem('audit-view.density', 'comfortable');
    const density = scope.run(() =>
      usePersistedTableDensity('audit', { storageKey: 'audit-view.density', defaultValue: 'compact' }),
    )!;

    expect(density.value).toBe('comfortable');

    density.value = 'standard';
    await nextTick();

    expect(window.localStorage.getItem('audit-view.density')).toBe('standard');
    expect(window.localStorage.getItem(`${PREFIX}table-density.audit`)).toBeNull();
  });

  it('uses defaultValue when nothing is stored', () => {
    expect(create(PREFIX, 'compact').value).toBe('compact');
  });

  it('ignores a corrupt or unknown payload', () => {
    window.localStorage.setItem(KEY, 'cozy');
    expect(create().value).toBe('standard');

    window.localStorage.setItem(KEY, JSON.stringify('compact'));
    expect(create().value).toBe('standard');
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
      const density = create();
      density.value = 'compact';
    }).not.toThrow();
  });
});
