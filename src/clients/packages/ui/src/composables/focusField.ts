import { unref, type Ref } from 'vue';

/**
 * Resolves a template ref (component instance or element) to its root
 * HTMLElement. Shared by `focusField` and the focus-shortcut registry.
 */
export function resolveFieldRoot(target: Ref<unknown> | unknown): HTMLElement | null {
  const candidate = unref(target) as { $el?: unknown } | HTMLElement | null;
  if (!candidate) return null;

  // Vue components expose their root node as `$el`; a raw element is already it.
  const root = typeof candidate === 'object' && candidate !== null && '$el' in candidate ? candidate.$el : candidate;
  if (root instanceof HTMLElement) return root;

  // Multi-root components: `$el` is the first root node. A leading template
  // comment makes that a Comment, so walk siblings for the real element.
  if (root instanceof Node) {
    let node: Node | null = root;
    while (node) {
      if (node instanceof HTMLElement) return node;
      node = node.nextSibling;
    }
  }
  return null;
}

/**
 * Focuses a form field, given a template ref to one of this library's field
 * components — or to a raw element.
 *
 * This lives in @ets/ui rather than in a consuming app because the awkward
 * part is a fact about `Input.vue`: it roots at a WRAPPER (label + control +
 * error region), not at the `<input>`. A wrapper `<div>` is not focusable, so
 * `ref.value.$el.focus()` — the obvious thing to write — silently does nothing.
 * Hence the descent below. Keeping that knowledge next to the component means a
 * future change to Input's root is caught by this package's own test rather
 * than discovered as "the / shortcut stopped working" in an app.
 *
 * `unref` handles both call shapes, and both genuinely occur:
 *   - script code holds a real `Ref` (useFilterShortcut does);
 *   - a template binding like `@show="() => focusField(myRef)"` has already
 *     been auto-unwrapped by Vue before the call happens.
 * Without `unref`, the template site would pass an unwrapped value and reading
 * `.value` off it would be wrong.
 */
export function focusField(target: Ref<unknown> | unknown, opts: { select?: boolean } = {}): void {
  const root = resolveFieldRoot(target);
  if (!root) return;

  // Combobox triggers (Select / MultiSelect) are buttons with role="combobox",
  // not <select> — include them so focusShortcut works on those fields too.
  const el =
    root instanceof HTMLInputElement || root instanceof HTMLTextAreaElement
      ? root
      : (root.querySelector<HTMLElement>('input, textarea, select, [role="combobox"]') ?? root);

  if (typeof el.focus !== 'function') return;
  el.focus();
  // Select-on-focus makes type-to-replace work, which is what a filter field
  // wants: the operator reaches for the shortcut to search for something else.
  if (opts.select && (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) el.select();
}
