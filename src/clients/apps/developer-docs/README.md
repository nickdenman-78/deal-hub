# ETS Developer Documentation

This is a [VitePress](https://vitepress.dev) documentation project in the `src/clients` pnpm workspace.

Run from `src/clients`:

```bash
pnpm --filter @ets/app-developer-docs dev       # local dev server
pnpm --filter @ets/app-developer-docs build     # static site → docs/.vitepress/dist
pnpm --filter @ets/app-developer-docs preview   # serve the built site
```

Navigation and sidebars live in `docs/config.ts`; site config in `docs/.vitepress/config.mts`.
The favicons in `docs/public/` are byte-identical copies of `@ets/brand` assets (checked by
`packages/brand/src/assets.test.ts`).

## Attach project to the solution

To open this site in JetBrains Rider as part of the solution, select the `Files` view in the solution explorer,
navigate to `src/clients/apps`, right-click the `developer-docs` folder and choose `Tools | Attach to Solution`.
It then appears as an attached project in the `Solution` view.

**Note:** You have to attach the docs project on each machine you work on. This configuration is not stored in the
solution.
