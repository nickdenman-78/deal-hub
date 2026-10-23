# `@ets/ui`

Stanwell-branded Vue components on `@vuetify/v0` headless primitives: form controls, overlays, DataTable, blade stack, app layout, icons, and composables.

## Consumption

Raw source via `workspace:*`. Import from the barrel or subpaths:

```ts
import { Button, DataTable } from '@ets/ui';
import { useTheme } from '@ets/ui/composables/useTheme';
```

Styles are separate subpaths (import order is the app's decision):

```css
@import '@ets/ui/styles/theme.css';
@import '@ets/ui/styles/base.css';
@import '@ets/ui/styles/blade.css';
@import '@ets/ui/styles/layout.css'; /* AppLayout / sidebar rail */
@import '@ets/ui/styles/table.css';
@import '@ets/ui/styles/editor.css'; /* only if using @ets/editor */
```

## Editor skin (optional)

Apps that use `@ets/editor` should also:

```ts
app.use(createEtsEditorPlugin());
```

See [ATS ADR-0012](../../apps/developer-docs/docs/ats/adr/0012-headless-editor-styling-plugin.md) and [`CONTEXT.md`](../../CONTEXT.md).
