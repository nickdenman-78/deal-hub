import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/*
 * The three ETS marks live here so every frontend (SPA + VitePress) can
 * import the same bytes without pulling @ets/ui. Guard the filenames so a
 * tidy-up rename does not silently break AppSidebar brand slots.
 *
 * Favicons are the same bolt mark, sized for browser tabs. Canonical files live
 * here; each app's `public/` holds a byte-identical copy for static serving.
 * Refresh copies from this folder when regenerating — the hash check below
 * fails if an app drifts.
 */
const here = dirname(fileURLToPath(import.meta.url));
const assetsDir = resolve(here, './assets');
const clientsRoot = resolve(here, '../../..');

const logoFiles = ['ets-logo.svg', 'ets-logo-neg.svg', 'ets-mark.svg'] as const;
const faviconFiles = ['favicon.svg', 'favicon.png', 'apple-touch-icon.png'] as const;

const appPublicDirs = ['apps/ets/public'] as const;

function sha256(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

describe('brand logos', () => {
  it.each([...logoFiles])('exports %s', (name) => {
    expect(existsSync(resolve(assetsDir, name))).toBe(true);
  });
});

describe('brand favicons', () => {
  it.each([...faviconFiles])('exports %s', (name) => {
    expect(existsSync(resolve(assetsDir, name))).toBe(true);
  });

  it.each(appPublicDirs.flatMap((dir) => faviconFiles.map((file) => ({ dir, file }))))(
    'keeps $dir/$file in lockstep with brand',
    ({ dir, file }) => {
      const brandPath = resolve(assetsDir, file);
      const appPath = resolve(clientsRoot, dir, file);
      expect(existsSync(appPath), `${dir}/${file} missing — copy from packages/brand/src/assets`).toBe(true);
      expect(sha256(appPath), `${dir}/${file} drifted from brand`).toBe(sha256(brandPath));
    },
  );
});
