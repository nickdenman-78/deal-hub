import { computed, readonly, shallowRef, watch, type ComputedRef, type InjectionKey, type Ref } from 'vue';
import type { RouteLocationNormalized, Router } from 'vue-router';

/**
 * The pending navigation, which vue-router does not expose.
 *
 * The stack needs the destination, not just a boolean: a skeleton panel should
 * appear only when the navigation is going *deeper* into the current path,
 * because that is the case where a new blade is on its way. A navigation
 * somewhere else is replacing the whole stack, and a skeleton at the end of it
 * would be a lie.
 */
export interface NavigationState {
  pendingTo: Readonly<Ref<RouteLocationNormalized | null>>;
  isNavigating: ComputedRef<boolean>;
}

export const navigationStateKey = Symbol('ets.navigationState') as InjectionKey<NavigationState>;

/**
 * Registers the guards that track it. Call this *first*, before the dirty
 * guard and before any app guard, so it observes navigations that a later
 * guard goes on to abort.
 */
export function createNavigationState(router: Router): NavigationState {
  const pendingTo = shallowRef<RouteLocationNormalized | null>(null);

  router.beforeEach((to) => {
    pendingTo.value = to;
  });
  router.afterEach(() => {
    pendingTo.value = null;
  });
  router.onError(() => {
    pendingTo.value = null;
  });
  // Backstop. A guard redirect chain can settle without a matching afterEach
  // for the outer navigation, which would otherwise leave a skeleton on screen
  // for good.
  watch(router.currentRoute, () => {
    pendingTo.value = null;
  });

  return {
    pendingTo: readonly(pendingTo) as Readonly<Ref<RouteLocationNormalized | null>>,
    isNavigating: computed(() => pendingTo.value !== null),
  };
}

/** What a stack sees when the router layer was never installed. */
export function idleNavigationState(): NavigationState {
  const pendingTo = shallowRef<RouteLocationNormalized | null>(null);
  return {
    pendingTo: readonly(pendingTo) as Readonly<Ref<RouteLocationNormalized | null>>,
    isNavigating: computed(() => false),
  };
}
