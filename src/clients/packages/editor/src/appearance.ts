import {
  computed,
  getCurrentScope,
  inject,
  onScopeDispose,
  ref,
  toValue,
  type ComputedRef,
  type InjectionKey,
  type MaybeRefOrGetter,
  type Ref,
} from 'vue';

/**
 * Light/dark signal for Monaco theme selection (`vs` / `vs-dark`).
 *
 * Provided by a host plugin (Stanwell apps use `@ets/ui`'s
 * `createEtsEditorPlugin`) or overridden per instance via an `isDark` prop.
 * This package never imports `@ets/ui`.
 */
export interface EditorAppearance {
  isDark: Ref<boolean> | ComputedRef<boolean> | boolean;
}

export const editorAppearanceKey: InjectionKey<EditorAppearance> = Symbol.for('ets.editor.appearance');

/**
 * Reactive mirror of `<html data-theme="dark|light">` — the same attribute
 * `bootstrapTheme` writes and `@ets/brand` CSS matches.
 *
 * Monaco must follow this, not a possibly-duplicated `useTheme` singleton:
 * Vite + pnpm can resolve two copies of `@ets/ui`, so the plugin's injected
 * `isDark` can stay `false` while the document (and the rest of the SPA) is
 * already dark.
 */
function readDocumentIsDark(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.dataset.theme === 'dark';
}

function useDocumentThemeIsDark(): Ref<boolean> {
  const isDark = ref(readDocumentIsDark());

  if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') {
    return isDark;
  }

  const observer = new MutationObserver(() => {
    isDark.value = readDocumentIsDark();
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });

  // Sync once more in case theme was applied between ref init and observe.
  isDark.value = readDocumentIsDark();

  if (getCurrentScope()) {
    onScopeDispose(() => observer.disconnect());
  }

  return isDark;
}

/**
 * Resolves whether Monaco should use the dark theme.
 *
 * Precedence:
 * 1. Explicit `propIsDark` when `true` or `false` (not `null`/`undefined`)
 * 2. Painted `data-theme` on `<html>` (reactive)
 * 3. Injected appearance from `createEtsEditorPlugin`
 * 4. `false`
 *
 * Boolean props are dangerous here: Vue coerces an *omitted* `isDark?: boolean`
 * to `false`, which would look like "force light" and skip the host theme.
 * Call sites must default the prop to `null` (unset), not rely on `undefined`.
 */
export function useEditorAppearance(propIsDark?: MaybeRefOrGetter<boolean | null | undefined>): ComputedRef<boolean> {
  const injected = inject(editorAppearanceKey, undefined);
  const documentIsDark = useDocumentThemeIsDark();

  return computed(() => {
    const fromProp = toValue(propIsDark);
    // Only an explicit boolean overrides. `null`/`undefined` mean "follow host".
    // Do NOT use `fromProp !== undefined` — omitted Boolean props are `false`.
    if (fromProp === true || fromProp === false) return fromProp;

    if (typeof document !== 'undefined' && document.documentElement.dataset.theme) {
      return documentIsDark.value;
    }

    if (injected !== undefined) return toValue(injected.isDark);
    return false;
  });
}
