/**
 * Decisions taken over the blade registry, as pure functions.
 *
 * These are the parts most worth testing — where a blade closes to, which one
 * Escape acts on, which dirty blades block a navigation — so they are kept out
 * of the components entirely and given a list rather than a stack to read from.
 */
import type { BladeEntry } from './context';
import { isPathWithin } from './paths';

/**
 * The blade a panel at `depth` closes back to: the nearest one shallower than
 * it. Null for a root blade, which has nowhere to go.
 *
 * An explicit reverse loop rather than findLast: lib is ES2022 here, and
 * findLast is ES2023.
 */
export function ancestorOf(blades: readonly BladeEntry[], depth: number): BladeEntry | null {
  for (let i = blades.length - 1; i >= 0; i--) {
    const candidate = blades[i];
    if (candidate && candidate.depth < depth) return candidate;
  }
  return null;
}

/**
 * The deepest blade Escape can act on.
 *
 * Not simply the deepest blade. A stack often ends in a display-only panel
 * with no ✕, and Escape skipping over it to the nearest closable ancestor is
 * what closing means there — the display panel leaves with its parent. A blade
 * with no ancestor is excluded too: closing a root blade has no destination.
 */
export function deepestClosableDepth(blades: readonly BladeEntry[]): number {
  let deepest = -1;
  for (const blade of blades) {
    if (!blade.closable) continue;
    if (blade.depth <= deepest) continue;
    if (!blades.some((other) => other.depth < blade.depth)) continue;
    deepest = blade.depth;
  }
  return deepest;
}

/**
 * The dirty blades a navigation to `toPath` would abandon.
 *
 * Moving *within* a dirty blade — opening its children, switching between
 * them — is not leaving it, and must not prompt. That is the whole reason the
 * guard lives at the stack rather than on each blade.
 */
export function dirtyOffenders(blades: readonly BladeEntry[], toPath: string): BladeEntry[] {
  return blades.filter((blade) => blade.dirty && !isPathWithin(blade.path, toPath));
}
