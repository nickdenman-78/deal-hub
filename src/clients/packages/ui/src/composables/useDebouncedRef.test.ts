import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick, ref } from 'vue';
import { useDebouncedRef } from './useDebouncedRef';

describe('useDebouncedRef', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('mirrors the initial value synchronously', () => {
    const source = ref('restored');
    const scope = effectScope();
    const debounced = scope.run(() => useDebouncedRef(source, 300))!;

    // Not after 300ms — immediately. A session-restored filter must show its
    // results on mount rather than appearing to load.
    expect(debounced.value).toBe('restored');
    scope.stop();
  });

  it('holds the update until the delay elapses', async () => {
    const source = ref('a');
    const scope = effectScope();
    const debounced = scope.run(() => useDebouncedRef(source, 300))!;

    source.value = 'b';
    await nextTick();
    expect(debounced.value).toBe('a');

    vi.advanceTimersByTime(299);
    expect(debounced.value).toBe('a');

    vi.advanceTimersByTime(1);
    expect(debounced.value).toBe('b');
    scope.stop();
  });

  it('collapses a burst of changes into one update', async () => {
    const source = ref('');
    const scope = effectScope();
    const debounced = scope.run(() => useDebouncedRef(source, 300))!;

    for (const ch of ['s', 'se', 'sec', 'secr']) {
      source.value = ch;
      await nextTick();
      vi.advanceTimersByTime(100); // each keystroke restarts the timer
    }
    expect(debounced.value).toBe('');

    vi.advanceTimersByTime(300);
    expect(debounced.value).toBe('secr');
    scope.stop();
  });

  it('clears a pending timer when its scope is disposed', async () => {
    const source = ref('a');
    const scope = effectScope();
    const debounced = scope.run(() => useDebouncedRef(source, 300))!;

    source.value = 'b';
    await nextTick();
    scope.stop();

    vi.advanceTimersByTime(1000);
    // The write never lands: the component that owned this is gone.
    expect(debounced.value).toBe('a');
  });
});
