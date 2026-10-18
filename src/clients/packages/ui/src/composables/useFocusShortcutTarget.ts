import { onBeforeUnmount, toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue';
import { focusField, resolveFieldRoot } from './focusField';
import { registerFocusShortcut } from './focusShortcutRegistry';

/**
 * Registers `root` as a Ctrl/Cmd+K (and `/`) focus target while `enabled` is
 * true. Used by field components' `focusShortcut` prop.
 */
export function useFocusShortcutTarget(enabled: MaybeRefOrGetter<boolean>, root: Ref<unknown>): void {
  let unregister: (() => void) | undefined;

  watch(
    () => toValue(enabled),
    (on) => {
      unregister?.();
      unregister = undefined;
      if (!on) return;
      unregister = registerFocusShortcut({
        getElement: () => resolveFieldRoot(root),
        focus: () => focusField(root, { select: true }),
      });
    },
    { immediate: true },
  );

  onBeforeUnmount(() => {
    unregister?.();
    unregister = undefined;
  });
}
