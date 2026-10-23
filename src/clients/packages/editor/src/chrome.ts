import { inject, type Component, type InjectionKey } from 'vue';

/**
 * Optional branded chrome for editor surfaces that need dialogs, fields, or
 * icons. Provided by `createEtsEditorPlugin` from `@ets/ui`; absent a
 * plugin, components fall back to plain HTML so this package stays headless.
 *
 * Components are expected to accept the same prop shapes the Stanwell plugin
 * wires — see each consumer's fallback markup for the minimum contract.
 */
export interface EditorChrome {
  /** Icon glyph. Props: `name: string`, `size?: number`. */
  Icon?: Component;
  /** Modal shell. Props include `open` (v-model), `title`, `description`, `size`; slot `#footer`. */
  Dialog?: Component;
  /** Text field. Props: `modelValue`, `label`, `type`, `placeholder`, `editable`, `error`, `errorMessages`. */
  Input?: Component;
  /** Action button. Props: `variant?`, `icon?`, `disabled?`. */
  Button?: Component;
}

export const editorChromeKey: InjectionKey<EditorChrome> = Symbol.for('ets.editor.chrome');

export function useEditorChrome(): EditorChrome {
  return inject(editorChromeKey, {});
}
