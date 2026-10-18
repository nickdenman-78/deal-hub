# `@ets/brand`

Framework-free design tokens, fonts, and logos. Survives a component-library change.

## Exports

- `@ets/brand/tokens.css` — light/dark semantic tokens (includes `--gradient-brand-sun` / `-inline` for illustration dividers)
- `@ets/brand/fonts.css` — self-hosted faces (SPAs only; VitePress sites import tokens alone)
- `@ets/brand/scrollbars.css` — theme-aware scrollbar chrome (pulled in by `@ets/ui/styles/theme.css`; VitePress sites import it beside tokens)
- `@ets/brand/assets/*` — Stanwell wordmark / dial PNGs, plus the shared favicon set

```ts
import logo from '@ets/brand/assets/stanwell-logo.png';
import logoNeg from '@ets/brand/assets/stanwell-logo-neg.png';
import dial from '@ets/brand/assets/stanwell-dial.png';
```

Use the light wordmark on light chrome, the neg wordmark on dark chrome, and the dial when space is tight (collapsed sidebar). Rendering belongs in the consumer — prefer `AppSidebarBrand` from `@ets/ui` for AppLayout chrome; this package only owns the bytes.

**Favicons** (derived from `stanwell-dial.png`, transparent ground):

| File                   | Role                               |
| ---------------------- | ---------------------------------- |
| `favicon.svg`          | Primary tab icon (modern browsers) |
| `favicon.png`          | 32×32 PNG fallback                 |
| `apple-touch-icon.png` | 180×180 home-screen / touch icon   |

Canonical bytes live here. Each app's `public/` (VitePress: `docs/public/` for developer-docs) holds a **byte-identical copy** for static serving — browser tabs cannot import from the package. After regenerating, copy the three files into every app `public/` listed in `assets.test.ts`; the hash check fails if any copy drifts.

## Rules

See [`src/clients/CONTEXT.md`](../../CONTEXT.md) and [ATS ADR-0010](../../apps/developer-docs/docs/ats/adr/0010-retail-ui-and-retail-editor.md).

Nothing Vue- or library-shaped belongs here.
