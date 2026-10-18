import { computed, inject, type ComputedRef } from 'vue';
import { bladeStackKey, type BladeEntry } from './context';
import { ancestorOf } from './registry';

/**
 * What a consumer may know about the stack.
 *
 * Deliberately narrower than what a Blade sees: registration and the strip
 * element stay behind bladeStackKey, so nothing outside this package can start
 * registering panels of its own.
 */
export interface UseBladeStack {
  /** Every mounted blade, shallowest first. */
  blades: ComputedRef<readonly BladeEntry[]>;
  /** The deepest blade, or null when the stack is empty. */
  top: ComputedRef<BladeEntry | null>;
  isMobile: ComputedRef<boolean>;
  /** Mobile only: which blade is on screen. */
  focusedId: ComputedRef<string | null>;
  focus: (id: string | null) => void;
  /** Where a blade at `depth` would close back to. */
  ancestorOf: (depth: number) => BladeEntry | null;
}

export function useBladeStack(): UseBladeStack {
  const stack = inject(bladeStackKey);
  if (!stack) {
    throw new Error('useBladeStack() must be called inside a <BladeStack>');
  }

  return {
    blades: stack.blades,
    top: computed(() => stack.blades.value[stack.blades.value.length - 1] ?? null),
    isMobile: stack.isMobile,
    focusedId: stack.focusedId,
    focus: stack.focus,
    ancestorOf: (depth: number) => ancestorOf(stack.blades.value, depth),
  };
}
