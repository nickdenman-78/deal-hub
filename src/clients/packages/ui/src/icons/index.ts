import { addCollection } from '@iconify/vue';
import lucideSubset from './generated/lucide.json';

/**
 * Registers the offline Lucide subset with Iconify.
 *
 * Must run before the first `<Icon>` renders — call it at the top of an app's
 * `main.ts`, alongside the other bootstrap steps and before `app.mount()`.
 * Without it, `<Icon icon="lucide:x" />` would try to fetch from the Iconify
 * CDN, which is exactly what we are avoiding.
 *
 * Idempotent: `addCollection` overwrites by prefix, so calling twice is
 * harmless (the tests rely on this).
 *
 * The subset is generated — see scripts/build-icons.mjs. To add an icon, edit
 * src/icons/names.json and run `pnpm --filter @ets/ui build:icons`.
 */
export function registerEtsIcons(): void {
  addCollection(lucideSubset);
}

/** Every icon name available offline, for tests and tooling. */
export const AVAILABLE_ICONS: readonly string[] = Object.freeze([
  ...Object.keys(lucideSubset.icons ?? {}),
  ...Object.keys((lucideSubset as { aliases?: Record<string, unknown> }).aliases ?? {}),
]);
