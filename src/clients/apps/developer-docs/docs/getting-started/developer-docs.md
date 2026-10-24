# The developer docs site

This site is a [VitePress](https://vitepress.dev) project, `@ets/app-developer-docs`, in the `src/clients` pnpm
workspace. It needs only Node.js and pnpm, not the .NET SDK or Docker.

## Run it

::: code-group

```pwsh [PowerShell]
cd src\clients
pnpm install
pnpm --filter @ets/app-developer-docs dev       # local dev server on http://localhost:5173
```

```bash [bash]
cd src/clients
pnpm install
pnpm --filter @ets/app-developer-docs dev       # local dev server on http://localhost:5173
```

:::

The dev server reloads pages as you edit them. To build and serve the static site:

```bash
pnpm --filter @ets/app-developer-docs build     # static site → apps/developer-docs/docs/.vitepress/dist
pnpm --filter @ets/app-developer-docs preview   # serve the built site
```

To build it as a container served by Caddy, use the `Dockerfile` in `src/clients/apps/developer-docs`, with
`src/clients` as the build context:

```bash
docker build -f src/clients/apps/developer-docs/Dockerfile -t ets-developer-docs:dev src/clients
```

## Where things are

| Path (under `src/clients/apps/developer-docs`) | What it holds                                                                   |
| ---------------------------------------------- | ------------------------------------------------------------------------------- |
| `docs/`                                        | The pages, one folder per section (`docs/<section>/index.md` plus pages)        |
| `docs/config.ts`                               | The top navigation (`nav`) and the sidebars (`sidebar`)                         |
| `docs/.vitepress/config.mts`                   | Site configuration: Mermaid, draw.io, math, code-group icons, custom containers |
| `docs/public/`                                 | Static files; the favicons are byte-identical copies of `@ets/brand` assets     |
| `docs/public/diagrams/`                        | `.drawio` and generated diagrams                                                |

## Adding a page

1. Create the page in its section's folder, one topic per page.
2. Add it to `nav` and `sidebar` in `docs/config.ts`; a page that is not in the sidebar is effectively lost.
3. Link to other pages with relative links. Refer to files elsewhere in the repository by their path in
   backticks, such as `docs/architecture/architecture.md`: a relative link that leaves `docs/` fails the build's
   dead-link check.
4. Format and build from `src/clients`:

   ```bash
   pnpm exec prettier --write apps/developer-docs
   pnpm --filter @ets/app-developer-docs build
   ```

   A failed build, usually a dead link, means the page is not done.

::: tip Explain how, link to why
This site explains _how_ to work on ETS. The design documents (`docs/architecture/**`, the ADRs, `src/CONTEXT.md`
and the glossaries) record _why_. Link to them rather than copying them, so the two never disagree.
:::

## Next

[Next steps](./next-steps).
