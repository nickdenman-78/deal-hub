import { readonly, ref, type InjectionKey, type Ref } from 'vue';
import type { Router } from 'vue-router';
import type { BladeEntry } from '../blade/context';
import { dirtyOffenders } from '../blade/registry';

/**
 * The unsaved-changes guard, built on a vue-router guard that returns a promise
 * the dialog resolves.
 *
 * One guard for the whole stack, deliberately. Per-blade onBeforeRouteLeave
 * would produce a queue of dialogs when two blades are dirty, and each would
 * fire on navigations that never leave the blade asking.
 */
export interface BlockerHandle {
  blocked: Readonly<Ref<boolean>>;
  /** Names of the blades that would lose changes, for the dialog to list. */
  titles: Readonly<Ref<readonly string[]>>;
  proceed: () => void;
  stay: () => void;
  /**
   * Registers the action to run after the user confirms a discard. The stack
   * owns the route navigation decision, while the root record blade owns the
   * actual Breeze reject.
   */
  setDiscard: (discard: () => void | Promise<void>) => void;
  clearDiscard: () => void;
  /**
   * Removes the guard and the beforeunload listener. The stack can unmount —
   * navigating to a screen that has no blades — and without this every remount
   * would leave another guard behind, so the third visit would ask three times.
   */
  dispose: () => void;
}

export const blockerKey = Symbol('ets.blocker') as InjectionKey<BlockerHandle>;

export function installDirtyGuard(
  router: Router,
  readBlades: () => readonly BladeEntry[],
  onDiscard?: () => void | Promise<void>,
): BlockerHandle {
  const blocked = ref(false);
  const titles = ref<readonly string[]>([]);
  let decide: ((proceed: boolean) => void) | null = null;
  let discard: (() => void | Promise<void>) | null = onDiscard ?? null;

  const removeGuard = router.beforeEach(async (to, from) => {
    if (to.path === from.path) return true;

    // One dialog at a time. A second navigation arriving while the first is
    // waiting would fail as NAVIGATION_CANCELLED, the one failure vue-router
    // excludes from its history restore, leaving the address bar out of step
    // with the page. Refusing it outright is the cheap way to stay out of that.
    if (blocked.value) return false;

    const offenders = dirtyOffenders(readBlades(), to.path);
    if (offenders.length === 0) return true;

    titles.value = offenders.map((blade) => blade.title);
    blocked.value = true;
    const proceed = await new Promise<boolean>((resolve) => {
      decide = resolve;
    });
    blocked.value = false;
    decide = null;

    if (proceed && discard) {
      await discard();
    }

    // Nothing touches history here, and that is deliberate. vue-router already
    // walks an aborted POP back itself (routerHistory.go(-info.delta) in its
    // failure path). Doing it again, which is the obvious-looking fix, moves
    // the browser back twice and lands the user a page further than they asked.
    return proceed;
  });

  // A guard cannot see a tab close or a hard reload. This is the only warning
  // available for those.
  const onBeforeUnload = (event: BeforeUnloadEvent) => {
    // Leaving the site abandons every dirty blade, so unlike the guard above
    // there is no destination to compare against: any dirt at all counts.
    if (!readBlades().some((blade) => blade.dirty)) return;
    event.preventDefault();
  };
  window.addEventListener('beforeunload', onBeforeUnload);

  return {
    blocked: readonly(blocked),
    titles: readonly(titles) as Readonly<Ref<readonly string[]>>,
    proceed: () => decide?.(true),
    stay: () => decide?.(false),
    setDiscard: (next) => {
      discard = next;
    },
    clearDiscard: () => {
      discard = null;
    },
    dispose: () => {
      removeGuard();
      window.removeEventListener('beforeunload', onBeforeUnload);
      // Anything still waiting on the dialog is released rather than left
      // hanging, or the navigation that opened it never settles.
      decide?.(false);
      discard = null;
    },
  };
}
