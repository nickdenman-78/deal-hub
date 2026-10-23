import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { __resetThemeForTests, bootstrapTheme, useTheme } from './useTheme';

// jsdom has no matchMedia. Every test drives the OS preference through this.
function stubMatchMedia(matches: boolean) {
  const listeners: ((event: MediaQueryListEvent) => void)[] = [];
  const query = {
    matches,
    addEventListener: (_: string, cb: (event: MediaQueryListEvent) => void) => listeners.push(cb),
  };
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => query),
  );
  return {
    /** Simulates the operator changing their OS appearance. */
    emit(next: boolean) {
      query.matches = next;
      listeners.forEach((cb) => cb({ matches: next } as MediaQueryListEvent));
    },
  };
}

const theme = () => document.documentElement.dataset.theme;

beforeEach(() => {
  __resetThemeForTests();
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('bootstrapTheme', () => {
  it('resolves "system" against the OS preference', () => {
    stubMatchMedia(true);
    bootstrapTheme();
    expect(theme()).toBe('dark');
    expect(useTheme().isDark.value).toBe(true);
  });

  it('writes light explicitly rather than omitting the attribute', () => {
    stubMatchMedia(false);
    bootstrapTheme();
    // "resolved to light" must be distinguishable from "theming never ran".
    expect(theme()).toBe('light');
  });

  it('restores a stored preference over the OS setting', () => {
    window.localStorage.setItem('ets.theme', 'light');
    stubMatchMedia(true);
    bootstrapTheme();
    expect(theme()).toBe('light');
  });

  it('reads the app-supplied storage key', () => {
    window.localStorage.setItem('retail-config-server.theme', 'dark');
    stubMatchMedia(false);
    bootstrapTheme({ storageKey: 'retail-config-server.theme' });
    expect(theme()).toBe('dark');
  });

  it('follows the OS while the preference is "system"', () => {
    const media = stubMatchMedia(false);
    bootstrapTheme();
    expect(theme()).toBe('light');
    media.emit(true);
    expect(theme()).toBe('dark');
  });

  it('ignores the OS once the preference is pinned', () => {
    const media = stubMatchMedia(false);
    bootstrapTheme();
    useTheme().setPreference('light');
    media.emit(true);
    expect(theme()).toBe('light');
  });

  it('is idempotent', () => {
    stubMatchMedia(true);
    bootstrapTheme();
    bootstrapTheme({ storageKey: 'other.key' });
    expect(theme()).toBe('dark');
  });

  it('survives localStorage throwing', () => {
    stubMatchMedia(false);
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError: storage disabled');
    });
    expect(() => bootstrapTheme()).not.toThrow();
    expect(theme()).toBe('light');
    getItem.mockRestore();
  });
});

describe('useTheme', () => {
  it('persists a chosen preference', () => {
    stubMatchMedia(false);
    bootstrapTheme();
    useTheme().setPreference('dark');
    expect(theme()).toBe('dark');
    expect(window.localStorage.getItem('ets.theme')).toBe('dark');
  });

  it('cycles light → dark → system, wrapping back to light', () => {
    stubMatchMedia(false);
    bootstrapTheme();
    // Destructured on purpose: this is how a component uses it, and a `this`-
    // bound method would break here.
    const { cycle, preference, setPreference } = useTheme();

    setPreference('light');
    cycle();
    expect(preference.value).toBe('dark');
    cycle();
    expect(preference.value).toBe('system');
    cycle();
    expect(preference.value).toBe('light');
  });

  it('cycles out of the default "system" into light', () => {
    stubMatchMedia(false);
    bootstrapTheme();
    const { cycle, preference } = useTheme();

    expect(preference.value).toBe('system');
    cycle();
    expect(preference.value).toBe('light');
  });
});
