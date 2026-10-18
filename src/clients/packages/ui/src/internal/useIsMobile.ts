import { computed, onScopeDispose, ref, type ComputedRef } from 'vue';

/**
 * The width below which the strip stops being a strip and shows one blade at a
 * time.
 */
const MOBILE_QUERY = '(max-width: 767px)';

export function useIsMobile(): ComputedRef<boolean> {
  // matchMedia is missing in jsdom unless a test stubs it. Reporting "not
  // mobile" is the right answer there and keeps every other test from needing
  // a polyfill just to mount a blade.
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return computed(() => false);
  }

  const query = window.matchMedia(MOBILE_QUERY);
  const matches = ref(query.matches);
  const onChange = (event: MediaQueryListEvent) => {
    matches.value = event.matches;
  };

  query.addEventListener('change', onChange);
  onScopeDispose(() => query.removeEventListener('change', onChange));

  return computed(() => matches.value);
}
