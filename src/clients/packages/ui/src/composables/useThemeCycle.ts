import { computed, type ComputedRef } from 'vue';
import { useTheme, type ThemePreference } from './useTheme';

/**
 * The one-button theme switcher: System → Light → Dark → System.
 *
 * This is the presentation half of `useTheme`, and it belongs beside it. Which
 * glyph means "follow the OS" is a design decision, not an app decision — and
 * the icons below are names from THIS package's offline Lucide subset, so an
 * app choosing its own would be picking from a set it does not own.
 *
 * The tooltip names both the current state and the next one, so a single
 * control is self-describing: a three-way cycle behind one button is otherwise
 * guesswork until you have clicked it three times.
 */
export interface ThemeCycleOption {
  value: ThemePreference;
  /** Lucide name from `@ets/ui`'s bundled subset. */
  icon: string;
  label: string;
}

export interface UseThemeCycle {
  current: ComputedRef<ThemeCycleOption>;
  next: ComputedRef<ThemeCycleOption>;
  tooltip: ComputedRef<string>;
  cycle: () => void;
}

/*
 * `system` leads, because it is the default and the cycle should start where a
 * new operator already is.
 */
const THEME_CYCLE: readonly ThemeCycleOption[] = [
  { value: 'system', icon: 'monitor', label: 'System' },
  { value: 'light', icon: 'sun', label: 'Light' },
  { value: 'dark', icon: 'moon', label: 'Dark' },
];

export function useThemeCycle(): UseThemeCycle {
  const { preference, setPreference } = useTheme();

  const currentIndex = computed(() => {
    const idx = THEME_CYCLE.findIndex((o) => o.value === preference.value);
    // A stored preference we do not recognise falls back to the head of the
    // cycle rather than throwing — localStorage is operator-editable.
    return idx === -1 ? 0 : idx;
  });

  const current = computed(() => THEME_CYCLE[currentIndex.value]);
  const next = computed(() => THEME_CYCLE[(currentIndex.value + 1) % THEME_CYCLE.length]);
  const tooltip = computed(() => `Theme: ${current.value.label} — click to switch to ${next.value.label}`);

  function cycle() {
    setPreference(next.value.value);
  }

  return { current, next, tooltip, cycle };
}
