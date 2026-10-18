/*
 * Subsets Lucide down to the icons @ets/ui actually renders.
 *
 * Why this exists: `@iconify/vue` can fetch icons on demand from the Iconify
 * CDN, which we will not do — these apps must work on a locked-down corporate
 * network and offline. The alternative, `addCollection(lucideIcons)`, works
 * offline but drags the entire ~1.3 MB collection into the bundle, because a
 * JSON object of 1,600 icons is opaque to tree-shaking.
 *
 * So: this script reads the full collection at development time and writes only
 * the named icons to src/icons/generated/lucide.json, which IS committed and IS
 * what ships. @iconify-json/lucide stays a devDependency.
 *
 * Adding an icon: add its name to src/icons/names.json, run
 * `pnpm --filter @ets/ui build:icons`, and commit both files. Rendering an
 * icon that was never generated shows nothing at all — no error, no console
 * warning — so the missing-name check below fails loudly instead.
 *
 *   pnpm --filter @ets/ui build:icons
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { icons as lucide } from '@iconify-json/lucide';
import { getIcons } from '@iconify/utils';

const here = dirname(fileURLToPath(import.meta.url));
const namesPath = resolve(here, '../src/icons/names.json');
const outPath = resolve(here, '../src/icons/generated/lucide.json');

const names = JSON.parse(readFileSync(namesPath, 'utf8'));

if (!Array.isArray(names) || names.length === 0) {
  throw new Error(`${namesPath} must be a non-empty array of icon names.`);
}

const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
if (duplicates.length > 0) {
  throw new Error(`Duplicate icon names in names.json: ${[...new Set(duplicates)].join(', ')}`);
}

const sorted = [...names].sort();
if (sorted.some((name, index) => name !== names[index])) {
  throw new Error('names.json must be sorted alphabetically — keeps diffs readable.');
}

const subset = getIcons(lucide, names);

if (subset === null) {
  throw new Error('getIcons() returned null — the Lucide collection failed to load.');
}

// getIcons silently drops names that do not exist, which would ship a component
// rendering an invisible icon. Catch it here instead.
const resolved = new Set([...Object.keys(subset.icons ?? {}), ...Object.keys(subset.aliases ?? {})]);
const missing = names.filter((name) => !resolved.has(name));
if (missing.length > 0) {
  throw new Error(`Not present in Lucide: ${missing.join(', ')}`);
}

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(subset, null, 2)}\n`, 'utf8');

const bytes = Buffer.byteLength(JSON.stringify(subset));
console.log(`Wrote ${names.length} icons to src/icons/generated/lucide.json (${(bytes / 1024).toFixed(1)} KB)`);
