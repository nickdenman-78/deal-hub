# ETS frontends

A single pnpm workspace holding every ETS web frontend, plus the UI code they
share. Apps deploy independently; only the source is unified.

```bash
npm install -g pnpm    # once — the version is pinned by "packageManager" in package.json
pnpm install           # one install for every app, from this directory
pnpm dev               # the ETS SPA on http://localhost:5300
pnpm showcase          # the UI showcase on http://localhost:5303
pnpm build             # build all apps
pnpm typecheck         # vue-tsc across every package
pnpm test              # vitest across every package
pnpm lint              # eslint
pnpm format            # prettier
```

| Path                     | What it is                                               |
| ------------------------ | -------------------------------------------------------- |
| `apps/ets`               | Vue 3 SPA: deal capture, settlement, risk                |
| `apps/ui-showcase`       | Showcase of every `@ets/ui` component (dev only)         |
| `packages/brand`         | Framework-free design tokens, fonts, logos               |
| `packages/ui`            | Design system on `@vuetify/v0` headless primitives       |
| `packages/editor`        | Opt-in Monaco / TipTap / markdown editors (not used yet) |
| `packages/tsconfig`      | Shared TypeScript bases                                  |
| `packages/eslint-config` | Shared ESLint flat config (incl. module-isolation rule)  |

## Running the SPA locally

1. Start the AppHost (`src/aspire/Ets.Aspire.AppHost`). It runs Keycloak on
   `:8080` and the API on `:5201`.
2. `pnpm dev` from this directory. `/api` is proxied to the API, so no CORS
   entry is needed.
3. Open http://localhost:5300 and sign in as `trader` / `trader`.

The repository [README](../../README.md) has the full build-and-run guide.

The SPA signs in with the public PKCE client **`ets-web`** in
`Realms/ets-realm.json`. Keycloak imports the realm only on the container's
first start — if your Keycloak container predates `ets-web`, delete the
container (it is persistent) so the realm is re-imported.

Overrides live in `apps/ets/.env.local` — see `apps/ets/.env.example`.

## Running the UI showcase

`apps/ui-showcase` renders every `@ets/ui` component, the editors and the
layout patterns, each in light and dark side by side, with example code and a
props table. It is a dev harness, never deployed, and needs no API or Keycloak.

From this directory:

```bash
pnpm install     # first time, or after pulling dependency changes
pnpm showcase    # dev server with hot reload on http://localhost:5303
```

To build it and serve the built output instead:

```bash
pnpm --filter @ets/app-ui-showcase build     # type-checks, then builds to apps/ui-showcase/dist
pnpm --filter @ets/app-ui-showcase preview   # serves dist on http://localhost:4173
```

`pnpm build` also builds the showcase alongside the SPA. When you add a
component to `packages/ui`, give it a page: a view in
`apps/ui-showcase/src/views/components/`, an entry in `src/nav.ts`, and its
example and props in `src/apiExamples.ts` and `src/apiDocs.ts`.

**Read [`CONTEXT.md`](CONTEXT.md) before adding a package or changing how
styles are shared.**
