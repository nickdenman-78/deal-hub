import type { Plugin } from 'vue';
import { computed } from 'vue';
import { editorAppearanceKey } from '@ets/editor/appearance';
import { editorChromeKey } from '@ets/editor/chrome';
import Button from '../components/Button.vue';
import Dialog from '../components/Dialog.vue';
import Icon from '../components/Icon.vue';
import Input from '../components/Input.vue';
import { useTheme } from '../composables/useTheme';

/**
 * Skins `@ets/editor` for ETS apps: provides light/dark appearance and
 * Dialog / Input / Button / Icon chrome for markdown link dialogs, toolbars,
 * and merge footers.
 *
 * Appearance prefers the painted `data-theme` on `<html>` (same signal brand
 * CSS uses), falling back to `useTheme().isDark`. Monaco follows that via
 * `useEditorAppearance` even if inject is stale — see `@ets/editor/appearance`.
 *
 * Pair with `@ets/ui/styles/editor.css` (imported by the app stylesheet).
 * Apps that do not use `@ets/editor` should not install this plugin.
 *
 * Call after `bootstrapTheme()` so `data-theme` is set, and after
 * `registerEtsIcons()` so toolbar icons resolve offline.
 *
 * Appearance/chrome keys are `Symbol.for(...)` in `@ets/editor` so provide
 * and inject share one identity across the ui↔editor package boundary.
 */
export function createEtsEditorPlugin(): Plugin {
  return {
    install(app) {
      const theme = useTheme();
      const isDark = computed(() => {
        if (typeof document !== 'undefined' && document.documentElement.dataset.theme) {
          return document.documentElement.dataset.theme === 'dark';
        }
        return theme.isDark.value;
      });
      app.provide(editorAppearanceKey, { isDark });
      app.provide(editorChromeKey, {
        Icon,
        Dialog,
        Input,
        Button,
      });
    },
  };
}
