# ETS frontends — conventions

The rules for `src/clients/`. Read this before adding a package, moving a
dependency, or changing how styles are shared.

## Origin

This workspace mirrors `retail-systems/src/clients`. `@ets/brand`, `@ets/ui`,
`@ets/editor`, `@ets/tsconfig` and `@ets/eslint-config` were **copied** from
their `@retail/*` counterparts and renamed (package scope, `registerEtsIcons`,
`createEtsEditorPlugin`, `--ets-*` CSS variables, `ets.*` storage keys and
injection symbols). From here on they are owned by ETS and evolve
independently; there is no sync back. Comments that cite "ATS ADR-00xx" refer
to the retail repository's ADRs, where the original rationale lives.

The initial `pnpm-lock.yaml` was seeded from the retail lockfile so the copied
packages run against the exact dependency versions their tests were written
for (a fresh resolve picks `@vuetify/v0` 1.2.x, which fails one ToggleGroup
test). Upgrade deliberately, not by deleting the lockfile.

## Layout

```
src/clients/            <- the workspace root. One lockfile, one node_modules.
├── apps/               <- deployables. One per independently shipped surface.
└── packages/           <- shared code. Never deployed on its own.
```

Rooted at `src/clients` so nothing above it (the .NET solution) is captured.

## Naming

- Deployables are `@ets/app-*` (`@ets/app-ets`), so
  `pnpm --filter '@ets/app-*' build` means "build everything that ships".
- Shared packages are the bare noun: `@ets/brand`, `@ets/ui`, `@ets/editor`.
- Everything is `"private": true`. Nothing here is published.

## Raw-source packages

Shared packages have no build step. Apps consume raw `.ts` / `.vue` / `.css`
through each package's `exports` map, which is why `moduleResolution` must be
`bundler`, and why each app's `vite.config.ts`:

- lists the workspace packages in `optimizeDeps.exclude`, and
- lists their runtime dependencies in `optimizeDeps.include` using the
  `owner > dep` form (`'@ets/ui > cronstrue'`). Under pnpm's isolated layout a
  bare name does not resolve from the app root.

## What goes in which shared package

- **`@ets/brand`** — framework-free tokens, fonts, logos and favicons. Nothing
  library-specific. Each app's `public/` holds a byte-identical copy of the
  favicons; `assets.test.ts` fails if one drifts.
- **`@ets/ui`** — hand-authored components on `@vuetify/v0`, the blade stack,
  app layout, icon subset (`src/icons/names.json` → `pnpm --filter @ets/ui
build:icons`) and the composables that pair with them. Admit something only
  if the package already owns its counterpart, or it is deliberately designed
  for more than one product app. **No domain vocabulary** — nothing that knows
  what a deal or a settlement is.
- **`@ets/editor`** — opt-in, headless; Monaco and ProseMirror stay out of
  `@ets/ui` so an app that renders no editor does not pay for them.

## Catalogue

Versions that must agree across packages live in `pnpm-workspace.yaml`
`catalog:`; consumers write `"vue": "catalog:"`. Catalogue only what genuinely
must agree.

## The ETS SPA (`apps/ets`)

- **Auth** — Keycloak, authorization code + PKCE via `oidc-client-ts`
  (ADR-0006). Tokens live in `sessionStorage`. Every route requires sign-in
  unless `meta.public`.
- **Permissions** — read from `GET /api/me`, never decoded from the token.
  `meta.permission` on a route and `session.can()` are UX only; the API
  enforces every permission itself. Permission names mirror the modules'
  `*Permissions.cs` catalogues (`src/lib/permissions.ts`).
- **Modules** — screens for each backend module live under
  `src/modules/<module>/`. ESLint forbids one module importing another;
  cross-module contracts go through the API, matching the backend rule that
  IntegrationEvents is a module's only public surface (ADR-0004).

## Formatting

Prettier owns formatting (`.prettierrc.json`); ESLint owns correctness.
`.gitattributes` forces LF so `format:check` passes on Windows checkouts too.
