import { computed, readonly, ref, type ComputedRef, type Ref } from 'vue';

/**
 * Three-way theme preference. `system` defers to the OS-level
 * `prefers-color-scheme` query and stays reactive to it (an operator changes
 * their OS appearance and the SPA flips); `light` / `dark` pin the resolved
 * theme regardless.
 */
export type ThemePreference = 'system' | 'light' | 'dark';

export interface ThemeOptions {
  /**
   * localStorage key. Apps should pass their existing key when adopting this,
   * otherwise every operator's saved preference is silently forgotten on first
   * load. config-admin's is `retail-config-server.theme`.
   */
  storageKey?: string;
  /** Preference to use when nothing is stored. Defaults to `system`. */
  fallback?: ThemePreference;
}

const DEFAULT_STORAGE_KEY = 'ets.theme';

/*
 * Module-scoped singleton rather than per-call state. There is exactly one
 * <html> element, so a second independent copy of this state could only ever
 * disagree with the DOM. Deliberately not a Pinia store: theming is not app
 * state, it needs to run before the Pinia instance exists (see bootstrapTheme's
 * note on FOUC), and making @ets/ui depend on Pinia for this alone would be
 * a hard dependency bought for nothing.
 */
const preference = ref<ThemePreference>('system');
const systemDark = ref(false);
let storageKey = DEFAULT_STORAGE_KEY;
let initialised = false;

const resolvedDark = computed(() => {
  if (preference.value === 'dark') return true;
  if (preference.value === 'light') return false;
  return systemDark.value;
});

function readPreference(fallback: ThemePreference): ThemePreference {
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (stored === 'system' || stored === 'light' || stored === 'dark') {
      return stored;
    }
  } catch {
    // Private mode, or storage disabled by policy. The fallback applies.
  }
  return fallback;
}

function writePreference(value: ThemePreference): void {
  try {
    window.localStorage.setItem(storageKey, value);
  } catch {
    // Same — the preference simply will not survive the session.
  }
}

/*
 * The whole theming contract in one line: an attribute on <html>, matched by
 * @ets/brand's `:where([data-theme='dark'], …)` block. Attribute rather than
 * class because a class is a shared namespace anything can write, whereas
 * data-theme has exactly one writer — this function.
 *
 * `light` is written explicitly rather than removing the attribute, so a
 * consumer can always tell "resolved to light" from "theming never ran".
 */
function apply(): void {
  document.documentElement.dataset.theme = resolvedDark.value ? 'dark' : 'light';
}

/**
 * Reads the stored preference, starts tracking the OS setting, and paints the
 * theme.
 *
 * Call this **before `app.mount()`**. Mounting first means the app paints in
 * light, then flips — a visible flash on every load for anyone using dark mode.
 *
 * Safe to call more than once; only the first call takes effect.
 */
export function bootstrapTheme(options: ThemeOptions = {}): void {
  if (initialised) return;
  initialised = true;

  storageKey = options.storageKey ?? DEFAULT_STORAGE_KEY;
  preference.value = readPreference(options.fallback ?? 'system');

  const query = window.matchMedia('(prefers-color-scheme: dark)');
  systemDark.value = query.matches;
  query.addEventListener('change', (event) => {
    systemDark.value = event.matches;
    apply();
  });

  apply();
}

export interface UseTheme {
  /** What the operator asked for. */
  preference: Readonly<Ref<ThemePreference>>;
  /** What is actually painted right now — resolves `system` against the OS. */
  isDark: ComputedRef<boolean>;
  setPreference: (value: ThemePreference) => void;
  /** Cycles light → dark → system. For a single toggle control. */
  cycle: () => void;
}

// Free functions, not methods: composables are routinely destructured
// (`const { cycle } = useTheme()`), which would strip `this` off a method and
// leave `cycle` throwing at the call site.
function setPreference(value: ThemePreference): void {
  preference.value = value;
  writePreference(value);
  apply();
}

function cycle(): void {
  const order: ThemePreference[] = ['light', 'dark', 'system'];
  setPreference(order[(order.indexOf(preference.value) + 1) % order.length]);
}

export function useTheme(): UseTheme {
  return {
    preference: readonly(preference),
    isDark: resolvedDark,
    setPreference,
    cycle,
  };
}

/** Test seam — resets the module singleton between test cases. */
export function __resetThemeForTests(): void {
  initialised = false;
  storageKey = DEFAULT_STORAGE_KEY;
  preference.value = 'system';
  systemDark.value = false;
}
