import { onBeforeUnmount, onMounted, type Ref } from 'vue';
import { focusField, resolveFieldRoot } from './focusField';
import { registerFocusShortcut } from './focusShortcutRegistry';

/**
 * Document-level shortcuts that focus a list screen's filter input.
 *
 * Two paths, deliberately different:
 *   - `/`        — the GitHub / Slack / YouTube convention. Suppressed while
 *                  focus is already inside an editable element, so a literal
 *                  slash typed into another field does not yank focus away.
 *   - Ctrl/Cmd+K — the Slack / Linear / VS Code convention. Always wins, even
 *                  from inside another input: Ctrl+K is reserved enough that
 *                  operators expect it to be page-global.
 *
 * On a match the field's existing text is selected, so the operator can
 * type-to-replace without clearing first.
 *
 * Prefer the `focusShortcut` prop on Input / Select / MultiSelect when the
 * target is one of those components — especially when several filters should
 * cycle under the same shortcut. This composable remains for a template ref
 * to a single field (or a raw element) that is not using the prop.
 *
 * Both paths share one registry: mixing them on the same page cycles across
 * every registered target in document order.
 *
 * The parameter is deliberately loose (`Ref<unknown>`): callers pass a template
 * ref to an `Input` component or to a raw element, and `focusField` resolves
 * either. Tightening it here would push a cast onto every call site.
 */
export function useFilterShortcut(target: Ref<unknown>): void {
  let unregister: (() => void) | undefined;

  onMounted(() => {
    unregister = registerFocusShortcut({
      getElement: () => resolveFieldRoot(target),
      focus: () => focusField(target, { select: true }),
    });
  });

  onBeforeUnmount(() => {
    unregister?.();
    unregister = undefined;
  });
}
