# `@ets/editor`

Headless Monaco code editors and sanitised markdown. Opt-in — deliberately not part of `@ets/ui`, so an app with no editor pays nothing.

## Halves (keep them separate)

| Surface                                 | Import                                              |
| --------------------------------------- | --------------------------------------------------- |
| Monaco (Diff / Json / Markdown / Merge) | `@ets/editor` barrel, or `@ets/editor/components/…` |
| Markdown render / excerpt               | `@ets/editor/components/MarkdownView` etc.          |
| Tiptap rich text                        | `@ets/editor/components/SimpleMarkdownEditor`       |
| Appearance / chrome keys                | `@ets/editor/appearance`, `@ets/editor/chrome`      |

Never re-export markdown or Tiptap from the Monaco barrel — Rollup treats a barrel as one module.

## Stanwell skin

This package has **no** runtime dependency on `@ets/ui`. For branded apps:

```ts
import { createEtsEditorPlugin } from '@ets/ui';
app.use(createEtsEditorPlugin());
```

```css
@import '@ets/ui/styles/editor.css';
```

Other apps provide `editorAppearanceKey` / `editorChromeKey` themselves, or accept unstyled structural chrome.

## Rules

- Never add `"sideEffects": false` — workers and jsonc registration are side-effect modules.
- `monaco-editor` is an optional peer (catalogued).
- Eager imports from an app root must use `defineAsyncComponent`.

See [`CONTEXT.md`](../../CONTEXT.md) and [ADR-0012](../../apps/developer-docs/docs/ats/adr/0012-headless-editor-styling-plugin.md).
