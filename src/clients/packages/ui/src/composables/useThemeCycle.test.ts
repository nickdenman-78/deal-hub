import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { __resetThemeForTests, bootstrapTheme, useTheme } from './useTheme';
import { useThemeCycle } from './useThemeCycle';

/*
 * useTheme is a module singleton, so each case resets it — same pattern as
 * useTheme.test.ts, including its matchMedia stub (jsdom has none).
 */
beforeEach(() => {
  __resetThemeForTests();
  window.localStorage.clear();
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: false, addEventListener: () => {} })),
  );
  bootstrapTheme();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useThemeCycle', () => {
  it('cycles System → Light → Dark → System', () => {
    const { current, cycle } = useThemeCycle();

    expect(current.value.value).toBe('system');
    cycle();
    expect(current.value.value).toBe('light');
    cycle();
    expect(current.value.value).toBe('dark');
    cycle();
    expect(current.value.value).toBe('system');
  });

  it('pairs each state with its own icon and label', () => {
    const { current, cycle } = useThemeCycle();

    expect(current.value).toMatchObject({ icon: 'monitor', label: 'System' });
    cycle();
    expect(current.value).toMatchObject({ icon: 'sun', label: 'Light' });
    cycle();
    expect(current.value).toMatchObject({ icon: 'moon', label: 'Dark' });
  });

  it('names both current and next in the tooltip, so one button is self-describing', () => {
    const { tooltip, cycle } = useThemeCycle();

    expect(tooltip.value).toBe('Theme: System — click to switch to Light');
    cycle();
    expect(tooltip.value).toBe('Theme: Light — click to switch to Dark');
    cycle();
    expect(tooltip.value).toBe('Theme: Dark — click to switch to System');
  });

  it('actually writes the preference through, not just its own view of it', () => {
    const { cycle } = useThemeCycle();
    cycle();
    expect(useTheme().preference.value).toBe('light');
  });

  it('falls back to the head of the cycle for an unrecognised stored preference', () => {
    // localStorage is operator-editable; a junk value must not throw.
    __resetThemeForTests();
    window.localStorage.setItem('ets.theme', 'chartreuse');
    bootstrapTheme();

    const { current } = useThemeCycle();
    expect(current.value.value).toBe('system');
  });
});
