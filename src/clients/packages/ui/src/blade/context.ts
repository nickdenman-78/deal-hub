import type { ComputedRef, InjectionKey, ShallowRef } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

/** One panel's entry in the stack's registry. */
export interface BladeEntry {
  id: string;
  depth: number;
  /** Plain string, because it is read as data: aria-label, crumb, dialog line. */
  title: string;
  /** The blade's own resolved path, params filled in. */
  path: string;
  dirty: boolean;
  closable: boolean;
  closeTo: RouteLocationRaw | undefined;
}

/**
 * What a Blade needs from its stack, and nothing a consumer should touch.
 *
 * Split from the public useBladeStack() surface deliberately: registration and
 * the strip element are implementation, and exposing them would invite a
 * second thing to start registering blades.
 */
export interface BladeStackInternals {
  strip: ShallowRef<HTMLElement | null>;
  /**
   * Where a <BladeAside> teleports to.
   *
   * Separate from the strip, and that separation is the whole point: an aside
   * docks to the trailing edge of the stack's *viewport* rather than to the
   * panel that opened it, the way Azure's context panes do. Anchored to the
   * panel it would move whenever the strip scrolled and would be as narrow as
   * whichever blade happened to own it.
   */
  asideHost: ShallowRef<HTMLElement | null>;
  isMobile: ComputedRef<boolean>;
  blades: ComputedRef<readonly BladeEntry[]>;
  /** Which blade is on screen on mobile. Null means "the deepest". */
  focusedId: ComputedRef<string | null>;
  focus: (id: string | null) => void;
  /**
   * Registers a *getter*, not a snapshot. The getter closes over the Blade's
   * own props, so a title or dirty flag changing is picked up without a watcher
   * and without re-registering.
   */
  register: (id: string, read: () => BladeEntry) => void;
  unregister: (id: string) => void;
}

export const bladeStackKey = Symbol('ets.bladeStack') as InjectionKey<BladeStackInternals>;

/**
 * Nesting depth. Provided as 0 by the stack, and as depth + 1 by every Blade
 * around its children — which reaches a <RouterView> written inside a Blade's
 * default slot, because injection resolves up the render tree and slot content
 * is patched with the slot host as its parent. vue-router's own viewDepthKey
 * works the same way.
 *
 * This is why <RouterView/> must be written INSIDE the Blade's default slot
 * rather than as a sibling. As a sibling it injects the parent's depth and
 * every nested blade collapses onto the same panel.
 */
export const bladeDepthKey = Symbol('ets.bladeDepth') as InjectionKey<number>;
