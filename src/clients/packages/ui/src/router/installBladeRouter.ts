import type { App } from 'vue';
import type { Router } from 'vue-router';
import { createNavigationState, navigationStateKey } from './navigationState';
import './types';

/**
 * Wires the blade stack's router layer into an app.
 *
 * Call it after `app.use(router)` and before `app.mount()`.
 *
 * ```ts
 * const app = createApp(App);
 * app.use(router);
 * installBladeRouter(app, router);
 * app.mount('#app');
 * ```
 *
 * Guard order is load-bearing: this registers `beforeEach` first, so the
 * pending-navigation state observes navigations that a later guard — the dirty
 * guard installed by <BladeStack> — goes on to abort. Registered the other way
 * round, a blocked navigation would never be seen as pending and the skeleton
 * logic could not tell "held at a dialog" from "not navigating".
 *
 * This is optional. <BladeStack> injects the navigation state with a
 * null-object default, so a stack still works without it — it simply never
 * shows a skeleton panel while a deeper route loads.
 *
 * The dirty guard is deliberately NOT installed here: it needs the live blade
 * registry, which only exists once <BladeStack> has mounted. See
 * blocker.ts.
 */
export function installBladeRouter(app: App, router: Router): void {
  app.provide(navigationStateKey, createNavigationState(router));
}
