# ETS — Energy Trading System

Deal capture, settlement and risk for participants in the Australian NEM:
ASX energy futures and OTC derivatives (swaps, caps, options).

- **Backend:** .NET 10 modular monolith (`src/modules`, `src/hosts`), run locally
  under .NET Aspire (`src/aspire`).
- **Frontend:** Vue 3 SPA in a pnpm workspace (`src/clients`).

Architecture and decisions: [`docs/architecture/`](docs/architecture/).
Frontend conventions: [`src/clients/CONTEXT.md`](src/clients/CONTEXT.md).

## Prerequisites

| Tool                                              | Version                                   | Check              |
| ------------------------------------------------- | ----------------------------------------- | ------------------ |
| [.NET SDK](https://dotnet.microsoft.com/download) | 10.0.300+ (pinned in `global.json`)       | `dotnet --version` |
| [Docker Desktop](https://www.docker.com/)         | Running — Aspire starts the containers    | `docker ps`        |
| [Node.js](https://nodejs.org/)                    | 22 or later                               | `node -v`          |
| [pnpm](https://pnpm.io/)                          | Any recent version (see below)            | `pnpm -v`          |
| [Aspire CLI](https://aspire.dev/) _(optional)_    | For `aspire run`; `dotnet run` also works | `aspire --version` |

**pnpm.** Install it once with `npm install -g pnpm`. The workspace pins
`pnpm@10.18.0` in `src/clients/package.json`, and newer pnpm versions switch
to that version automatically inside `src/clients`, so `pnpm -v` there
prints `10.18.0` whatever is installed globally. (`corepack enable` also
works on Node 22–24; Corepack is no longer bundled from Node 25.)

## Build

### Backend

```powershell
dotnet build ets.slnx
```

Analyzers run as part of the build; keep it warning-clean. There is no
separate .NET lint step.

### Frontend

```powershell
cd src\clients
pnpm install      # first time, and after any package.json / lockfile change
pnpm build        # vue-tsc type-check, then vite build
```

Output goes to `src/clients/apps/ets/dist/` (a static site).

`pnpm install` runs install scripts only for the packages approved in
`pnpm-workspace.yaml` (`esbuild`, `vue-demi`). If pnpm asks you to approve
builds, you are probably running a pnpm that ignores the pinned version —
check `pnpm -v` inside `src\clients`.

## Run locally

You need two terminals.

**1. Backend and dependencies**

```powershell
aspire run
# or: dotnet run --project src\aspire\Ets.Aspire.AppHost
```

This starts PostgreSQL, Redis, RabbitMQ, Keycloak (`:8080`), Seq and the API
(`:5201`). Open the Aspire dashboard link it prints and wait until every
resource is running. The first start pulls the container images and takes a
few minutes. The containers are persistent, so later starts are quick.

**2. Web app**

```powershell
cd src\clients
pnpm dev
```

**3. Open <http://localhost:5300>** and sign in through Keycloak as the
local test user **`trader` / `trader`**.

The dev server proxies `/api` to the API on `:5201`, so the API needs no CORS
entry. Edits to `.vue` and `.ts` files reload in place; restart `pnpm dev`
after changing `vite.config.ts` or `.env.local`.

### Local URLs

| What                   | URL                                                         |
| ---------------------- | ----------------------------------------------------------- |
| ETS web app            | http://localhost:5300                                       |
| API reference (Scalar) | http://localhost:5201/scalar/                               |
| Keycloak admin         | http://localhost:8080 (credentials in the Aspire dashboard) |
| Aspire dashboard / Seq | Linked from the `aspire run` output                         |

### Configuration

The web app's defaults match the AppHost. To override them, copy
`src/clients/apps/ets/.env.example` to `.env.local` in the same folder:

| Variable              | Default                             |
| --------------------- | ----------------------------------- |
| `VITE_OIDC_AUTHORITY` | `http://localhost:8080/realms/ets`  |
| `VITE_OIDC_CLIENT_ID` | `ets-web`                           |
| `VITE_OIDC_SCOPE`     | `openid profile email`              |
| `ETS_API`             | `http://localhost:5201` (dev proxy) |

## Test, lint and format

```powershell
# Backend
dotnet test ets.slnx

# Frontend (from src\clients)
pnpm test           # vitest
pnpm typecheck      # vue-tsc
pnpm lint           # eslint
pnpm format         # prettier --write  (format:check in CI)
```

## Troubleshooting

**Sign-in fails with "Client not found" or "Invalid redirect URI".**
Keycloak imports `src/aspire/Ets.Aspire.AppHost/Realms/ets-realm.json` only
the first time its container starts. If your container is older than the
realm file's `ets-web` client, delete the `keycloak` container (Docker
Desktop, or `docker rm -f <name>`) and restart the AppHost.

**Menu items such as Deals are missing.** The sidebar shows only screens the
signed-in user has permission for, read from `GET /api/me`. Sign-in is
working; the user has not been granted that permission. The API enforces
permissions on every endpoint regardless.

**`pnpm dev` says port 5300 is in use.** The port is fixed because it is
registered as a redirect URI on the Keycloak client. Stop the other process
rather than changing the port.

**`pnpm preview` can't sign in.** Preview serves on a different port, which
Keycloak does not accept as a redirect. Use `pnpm dev` for local work.
