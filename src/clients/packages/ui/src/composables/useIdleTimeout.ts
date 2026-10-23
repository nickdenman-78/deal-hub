import { onUnmounted, ref, type Ref } from 'vue';

export interface IdleTimeoutOptions {
  // Total idle seconds before onTimeout fires.
  timeoutSeconds: number;
  // How many seconds BEFORE the timeout the warning becomes active.
  warningSeconds: number;
  // Invoked once when the idle period reaches timeoutSeconds. Typically signs the user out.
  onTimeout: () => void;
  // When false the composable is fully inert: no listeners, no interval, refs never
  // change. Used so the timer can be mounted app-wide (every route, including the
  // public landing page) yet only actually run for a signed-in session. Defaults true.
  enabled?: boolean;
}

export interface IdleTimeoutHandle {
  // True while within the warning window (timeout - warning .. timeout).
  warningActive: Ref<boolean>;
  // Whole seconds left until logout. Only meaningful while warningActive is true.
  secondsRemaining: Ref<number>;
  // Explicitly treat "now" as activity (e.g. the user clicked "Stay signed in").
  reset: () => void;
  // Detach listeners + timer. Called automatically on component unmount.
  stop: () => void;
}

// Wall-clock idle tracker. Activity events stamp `lastActivity`; a 1s interval derives
// state from (now - lastActivity). Deriving from wall-clock — rather than rescheduling a
// setTimeout per event — is what makes this correct across background-tab timer throttling:
// browsers clamp background intervals to ~1/min, but the delta is still accurate, so a tab
// left untouched past the timeout logs out on the first tick after it regains focus rather
// than silently extending the session.
//
// Deliberate interaction within the warning window cancels the warning — clicks,
// keystrokes, scroll/wheel, touch. `mousemove` is intentionally excluded: incidental
// cursor drift (or a bumped desk) is not the operator working, and counting it would
// keep a session alive indefinitely on an unattended machine — exactly what the
// inactivity logout exists to prevent. The dialog button is just the obvious affordance.
export function useIdleTimeout(options: IdleTimeoutOptions): IdleTimeoutHandle {
  const timeout = Math.max(1, options.timeoutSeconds);
  // Warning lead can't exceed the timeout itself; clamp so the window stays sane.
  const warning = Math.min(Math.max(1, options.warningSeconds), timeout);

  const warningActive = ref(false);
  const secondsRemaining = ref(0);

  let lastActivity = Date.now();
  let fired = false;
  let intervalId: number | null = null;

  // Passive, capture-phase so we see the activity even if a child stops propagation.
  // No 'mousemove' — see the header comment for why passive cursor drift is excluded.
  const events: (keyof WindowEventMap)[] = ['mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'];

  function markActivity(): void {
    lastActivity = Date.now();
    if (warningActive.value) {
      warningActive.value = false;
    }
  }

  function reset(): void {
    markActivity();
  }

  function tick(): void {
    if (fired) return;
    const idle = (Date.now() - lastActivity) / 1000;

    if (idle >= timeout) {
      fired = true;
      stop();
      options.onTimeout();
      return;
    }

    if (idle >= timeout - warning) {
      warningActive.value = true;
      secondsRemaining.value = Math.max(0, Math.ceil(timeout - idle));
    } else if (warningActive.value) {
      warningActive.value = false;
    }
  }

  function stop(): void {
    if (intervalId !== null) {
      window.clearInterval(intervalId);
      intervalId = null;
    }
    for (const e of events) {
      window.removeEventListener(e, markActivity, true);
    }
  }

  // Inert when disabled — the composable is still called unconditionally (no
  // conditional-hook smell) but attaches nothing. onUnmounted(stop) is still
  // registered; stop() with no interval/listeners is a safe no-op.
  if (options.enabled !== false) {
    for (const e of events) {
      window.addEventListener(e, markActivity, { capture: true, passive: true });
    }
    intervalId = window.setInterval(tick, 1000);
  }

  onUnmounted(stop);

  return { warningActive, secondsRemaining, reset, stop };
}
