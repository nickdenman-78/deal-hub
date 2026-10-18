/**
 * Route meta this package reads.
 *
 * Augmenting vue-router's RouteMeta from a library is a strong move, so it is
 * kept to the one key the stack genuinely cannot work without. `blade` is the
 * marker that lets a blade find its own matched record: depth counts blades,
 * and route.matched counts records, and the two differ the moment a layout
 * record renders no panel.
 *
 * The upstream implementation also carried a `loader` key for route-level data
 * fetching backed by a Pinia store. That layer is deliberately not ported yet —
 * it is an app concern, config-admin already has its own API client, and
 * bringing it across would make Pinia a hard dependency of @ets/ui for
 * something no consumer has asked for. BladeStack degrades cleanly without it
 * (it just never shows a skeleton), so adding it later is additive.
 */
import 'vue-router';

declare module 'vue-router' {
  interface RouteMeta {
    /** Marks a record whose component renders a <Blade>. */
    blade?: boolean;
  }
}

export {};
