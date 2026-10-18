import { onScopeDispose } from 'vue';

/**
 * Remembers the control a pointer interaction last went through, so an overlay
 * can put focus back where it came from.
 *
 * `document.activeElement` alone is not enough. A click does not reliably focus
 * the thing it hits: Safari famously does not focus <button> on click, and a
 * component library may preventDefault on mousedown for its own reasons. When
 * that happens activeElement is still <body> at the moment the overlay opens,
 * the overlay records nothing, and closing it strands the reader at the top of
 * the document instead of on the control they pressed.
 *
 * Keyboard activation does not have this problem — Enter on a button implies the
 * button is focused — so this only has to cover the pointer case, and
 * activeElement stays the preferred answer when it is meaningful.
 *
 * One listener is shared across every caller and removed when the last scope
 * using it goes away.
 */

const TRIGGER_SELECTOR = 'button, [role="button"], a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

let subscribers = 0;
let lastTrigger: HTMLElement | null = null;

function onPointerDown(event: Event) {
  const target = event.target;
  lastTrigger = target instanceof Element ? target.closest<HTMLElement>(TRIGGER_SELECTOR) : null;
}

export interface UseFocusOrigin {
  /**
   * The best guess at what the reader last activated: the focused element when
   * that is meaningful, otherwise the control the last pointerdown passed
   * through. Null when neither is usable.
   */
  resolve: () => HTMLElement | null;
  /**
   * Returns focus to `element`, if it is still in the document and focusable.
   * A blade closing can take the trigger with it, and focusing a detached node
   * silently sends focus to <body> — which is the very thing being avoided.
   */
  restore: (element: HTMLElement | null) => void;
}

export function useFocusOrigin(): UseFocusOrigin {
  if (typeof document !== 'undefined') {
    // Capture phase: a handler that stops propagation must not be able to hide
    // the interaction from us.
    if (subscribers++ === 0) document.addEventListener('pointerdown', onPointerDown, true);

    onScopeDispose(() => {
      if (--subscribers === 0) {
        document.removeEventListener('pointerdown', onPointerDown, true);
        lastTrigger = null;
      }
    });
  }

  return {
    resolve() {
      const active = document.activeElement;
      if (active instanceof HTMLElement && active !== document.body && active !== document.documentElement) {
        return active;
      }
      return lastTrigger;
    },
    restore(element) {
      if (!element || !element.isConnected) return;
      element.focus();
    },
  };
}

/** Test seam — clears the remembered trigger between cases. */
export function __resetFocusOriginForTests(): void {
  lastTrigger = null;
}
