# `@ets/brand`

Framework-free design tokens, fonts, and logos. Survives a component-library change.

## Exports

- `@ets/brand/tokens.css` — the Night Desk palette: light/dark semantic tokens, including `--buy`/`--sell`/`--gain`/`--loss` for trading direction and `--gradient-brand` / `-inline` for illustration dividers. Dark is the SPA default.
- `@ets/brand/fonts.css` — self-hosted faces (SPAs only; VitePress sites import tokens alone)
- `@ets/brand/scrollbars.css` — theme-aware scrollbar chrome (pulled in by `@ets/ui/styles/theme.css`; VitePress sites import it beside tokens)
- `@ets/brand/assets/*` — ETS wordmark / mark SVGs, plus the shared favicon set

```ts
import logo from '@ets/brand/assets/ets-logo.svg';
import logoNeg from '@ets/brand/assets/ets-logo-neg.svg';
import mark from '@ets/brand/assets/ets-mark.svg';
```

Use the light wordmark on light chrome, the neg wordmark on dark chrome, and the mark when space is tight (collapsed sidebar). Rendering belongs in the consumer — prefer `AppSidebarBrand` from `@ets/ui` for AppLayout chrome; this package only owns the bytes.

**Favicons** (the bolt tile from `ets-mark.svg`, transparent ground):

| File                   | Role                               |
| ---------------------- | ---------------------------------- |
| `favicon.svg`          | Primary tab icon (modern browsers) |
| `favicon.png`          | 32×32 PNG fallback                 |
| `apple-touch-icon.png` | 180×180 home-screen / touch icon   |

Canonical bytes live here. Each app's `public/` (VitePress: `docs/public/` for developer-docs) holds a **byte-identical copy** for static serving — browser tabs cannot import from the package. After regenerating, copy the three files into every app `public/` listed in `assets.test.ts`; the hash check fails if any copy drifts.

## Rules

See [`src/clients/CONTEXT.md`](../../CONTEXT.md) and [ATS ADR-0010](../../apps/developer-docs/docs/ats/adr/0010-retail-ui-and-retail-editor.md).

Nothing Vue- or library-shaped belongs here.
