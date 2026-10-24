# Prerequisites

Install these once per machine. Every version that matters is pinned in the repository, so the table says where to
look rather than repeating a number that will drift.

| Tool                                                        | Version                                                         | Check                 |
| ----------------------------------------------------------- | --------------------------------------------------------------- | --------------------- |
| [.NET SDK](https://dotnet.microsoft.com/download)           | 10.0.300 or a later 10.0 feature band (pinned in `global.json`) | `dotnet --version`    |
| [Docker Desktop](https://www.docker.com/)                   | Running — Aspire starts the backing services as containers      | `docker ps`           |
| [Node.js](https://nodejs.org/)                              | 22 or later (`engines` in `src/clients/package.json`)           | `node -v`             |
| [pnpm](https://pnpm.io/)                                    | Pinned by `packageManager` in `src/clients/package.json`        | `pnpm -v`             |
| [dotnet-ef](https://learn.microsoft.com/ef/core/cli/dotnet) | For database migrations                                         | `dotnet ef --version` |
| [Aspire CLI](https://aspire.dev/) _(optional)_              | For `aspire run`; `dotnet run` does the same job                | `aspire --version`    |

## .NET SDK

`global.json` pins SDK `10.0.300` with `rollForward: latestFeature`, so any later 10.0 feature band works and a
preview SDK does not. The same file pins the Aspire AppHost SDK (`msbuild-sdks`), which is restored like a NuGet
package: you do not install Aspire workloads.

## Docker

The AppHost runs PostgreSQL, Redis, RabbitMQ, Keycloak and Seq as containers, so Docker must be running before you
start it. The first start pulls every image, which takes a few minutes; see [Build and run](./build-and-run).

## Node.js and pnpm

Install pnpm once with npm:

```bash
npm install -g pnpm
```

The workspace pins its pnpm version in the `packageManager` field of `src/clients/package.json`. pnpm 10 and later
switch to that version automatically inside `src/clients`, so `pnpm -v` there prints the pinned version whatever is
installed globally. `corepack enable` also works on Node 22 to 24; Corepack is no longer bundled from Node 25.

::: tip Check the version where it matters
Run `pnpm -v` from `src/clients`, not from the repository root. If it prints anything other than the version in
`packageManager`, your global pnpm is too old to switch versions; upgrade it.
:::

## The EF Core tools

`dotnet ef` adds and applies the modules' database migrations. Install it as a global tool:

```bash
dotnet tool install --global dotnet-ef
```

Use `dotnet tool update --global dotnet-ef` to move an existing install forward.

## The Aspire CLI (optional)

`aspire run` from the repository root finds the AppHost through `aspire.config.json` and is the friendliest way to
start it. You do not need the CLI for anything else: the AppHost resolves the Aspire dashboard and orchestrator
from the CLI bundle at the version paired with its SDK in `global.json`, run through `dnx` (which ships with the
.NET 10 SDK), never from whatever `aspire` is on your `PATH`. See ADR-0007,
`docs/architecture/adr/0007-aspire-for-local-orchestration.md`.

## Next

Take the [tour of the repository](./project-layout), or go straight to [opening it in your IDE](./ide).
