import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/*
 * Static guards on tokens.css.
 *
 * These are string assertions rather than rendered-CSS assertions because jsdom
 * has no cascade worth testing against — it does not resolve custom properties
 * across selectors, which is precisely the mechanism at issue. The real
 * behaviour is verified in a browser via apps/ui-showcase; these tests exist to
 * stop someone "tidying" the file back into a shape that silently breaks.
 */
const tokensCss = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), './tokens.css'), 'utf8');

describe('brand tokens', () => {
  /*
   * The bug this guards against, in full:
   *
   *   :root                      → specificity (0,1,0); a pseudo-class counts
   *                                as a class.
   *   :where([data-theme=dark])  → specificity (0,0,0) by definition.
   *
   * So a dark block written only as `:where(…)` LOSES to the light `:root`
   * block on <html>, and the page stays light with data-theme="dark" visibly
   * present in the DOM. Worse, a themed *subtree* still flips correctly —
   * `:root` cannot match a <div> — so it looks like theming works.
   *
   * The fix is to carry both selectors: `:root:where(…)` to match :root's
   * specificity and win on source order, plus bare `:where(…)` for subtrees.
   */
  it('overrides the root at matching specificity, not just subtrees', () => {
    expect(tokensCss).toContain(":root:where([data-theme='dark']");
    expect(tokensCss).toMatch(/^:where\(\[data-theme='dark'/m);
  });

  it('keeps .dark for VitePress, which owns its own toggle', () => {
    expect(tokensCss).toContain('.dark');
  });

  /*
   * Every semantic token must exist in both themes. A token defined only in
   * light does not error in dark — it silently inherits the light value, which
   * is how you end up with black-on-black text nobody notices until a user
   * reports it.
   */
  it('defines every semantic token in both light and dark', () => {
    const blocks = tokensCss.split(/^:root:where\(\[data-theme='dark'/m);
    expect(blocks).toHaveLength(2);

    const [lightSide, darkSide] = blocks;
    const declared = (css: string) => new Set([...css.matchAll(/^\s{2}(--[a-z0-9-]+):/gm)].map((m) => m[1]));

    const light = declared(lightSide);
    const dark = declared(darkSide);

    // Primitives, scales and legacy aliases are theme-invariant by design.
    const invariant = (token: string) =>
      token.startsWith('--nd-') ||
      token.startsWith('--gradient-') ||
      token.startsWith('--sp-') ||
      token.startsWith('--fs-') ||
      token.startsWith('--lh-') ||
      token.startsWith('--fw-') ||
      token.startsWith('--tr-') ||
      token.startsWith('--r-') ||
      token.startsWith('--font-') ||
      token.startsWith('--ease-') ||
      token.startsWith('--dur-') ||
      token.startsWith('--kpi-') ||
      token === '--scrollbar-size' ||
      // Blade PANEL WIDTHS are invariant. --blade-scrim deliberately is not —
      // it is a colour, so the prefix is not blanket-exempt.
      /^--blade-(sm|md|lg|xl|fill-max)$/.test(token);

    const missingInDark = [...light].filter((token) => !invariant(token) && !dark.has(token));
    expect(missingInDark).toEqual([]);
  });

  /*
   * A custom property whose value is `var(--something-themed)` resolves at the
   * element carrying the DECLARATION, not at the element using it. Declared on
   * :root, it freezes to :root's value and inherits that computed result into
   * every descendant — so a themed subtree silently keeps the root's colour.
   *
   * Document-level theming hides this (both sides get redefined on :root), and
   * it surfaced as a 1.56:1 code pill in the showcase's dark specimen pane.
   * Semantic tokens must therefore reference primitives or literals only.
   */
  it('never defines a themed token in terms of another themed token', () => {
    const offenders = [...tokensCss.matchAll(/^\s{2}(--[a-z0-9-]+):\s*var\((--[a-z0-9-]+)\)/gm)]
      .filter(([, , referenced]) => !referenced.startsWith('--nd-'))
      .map(([, token, referenced]) => `${token} -> ${referenced}`);

    expect(offenders).toEqual([]);
  });

  it('has no stray Google Fonts import — faces are self-hosted', () => {
    expect(tokensCss).not.toContain('fonts.googleapis.com');
  });
});
