import type { RouterScrollBehavior } from 'vue-router';

/**
 * Keeps the page from scrolling to the top when you move between blades.
 *
 * The strip has not gone anywhere and only one panel in it changed, so a scroll
 * reset is wrong. Decided once from route meta, so it covers BladeLink,
 * programmatic pushes, the Escape close and the browser's back button alike,
 * with no call site needing to remember anything.
 *
 * The strip's own horizontal scrollLeft is untouched by any of this. It is an
 * element scroll position on an element that never unmounts, so nothing resets
 * it; the stack's auto-scroll is the only thing that writes it.
 */
export function bladeScrollBehavior(options: { resetKey?: string } = {}): RouterScrollBehavior {
  const resetKey = options.resetKey ?? 'etsResetScroll';

  return (to, from, savedPosition) => {
    // Back and forward: put them where they were. This runs after the history
    // entry is in place, so savedPosition is the real one.
    if (savedPosition) return savedPosition;

    // The escape hatch, for the rare intra-stack navigation that really is a
    // fresh start:
    //   router.push({ path, state: { etsResetScroll: true } })
    const state = history.state as Record<string, unknown> | null;
    if (state && state[resetKey] === true) return { top: 0 };

    // meta is the merge of every matched record, so any route inside a stack
    // reports blade: true.
    if (to.meta.blade === true && from.meta.blade === true) return false;

    return { top: 0 };
  };
}
