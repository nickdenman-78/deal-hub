# Troubleshooting

## Signing in

**Sign-in fails with "Client not found" or "Invalid redirect URI".** Keycloak imports
`src/aspire/Ets.Aspire.AppHost/Realms/ets-realm.json` only the first time its container starts. If your container
is older than the realm file's `ets-web` client, or you edited the realm, delete the `keycloak` container (in
Docker Desktop, or with `docker rm -f <name>`) and restart the AppHost.

**Menu items such as Deals are missing.** The sidebar shows only the screens the signed-in user has permission for,
read from `GET /api/me`. Sign-in is working; the user has not been granted that permission. Check the user's roles
in `Users:DevelopmentSeed` (`src/hosts/Ets.Servers.Api/appsettings.Development.json`). The API enforces
permissions on every endpoint regardless of what the menu shows.

**`pnpm preview` can't sign in.** Preview serves on a different port, which Keycloak does not accept as a redirect.
Use `pnpm dev` for local work.

## Ports

**`pnpm dev` says port 5300 is in use.** The port is fixed because it is registered as a redirect URI on the
Keycloak client. Stop the other process rather than changing the port.

**Keycloak fails to start because port 8080 is in use.** The AppHost fixes Keycloak on `8080` so the token issuer
is the same URL for the browser and the API. Stop whatever else is listening on `8080`.

## The AppHost and containers

**The AppHost hangs or fails before any resource starts.** Docker is not running, or not reachable. Check with
`docker ps`, then restart the AppHost.

**A resource stays in "Waiting".** The API waits for PostgreSQL, Redis, RabbitMQ, Keycloak and Seq. On the first
start the images are still being pulled; otherwise open the waiting resource's logs in the Aspire dashboard.

**The API stops at startup in Development.** The Users development seed applies the Users migrations and adds the
seeded roles and users; a seed that breaks an invariant stops the host on purpose. Read the `ets-api` logs in the
dashboard and fix `Users:DevelopmentSeed`.

## pnpm

**pnpm asks you to approve builds.** You are running a pnpm that ignores the pinned version. Check `pnpm -v`
inside `src/clients` against `packageManager` in `src/clients/package.json`, and upgrade your global pnpm if they
differ. See [Prerequisites](./prerequisites#node-js-and-pnpm).

**The page reloads itself the first time a shared component is used.** Vite discovered a dependency of a shared
package late. Add it to the app's `optimizeDeps.include` in the `'@ets/ui > dep'` form; `src/clients/CONTEXT.md`
explains why.

## Migrations

**`dotnet ef database update` fails with an authentication error.** The design-time factory has no password. Put
the real connection string in `appsettings.Migrations.local.json` or `ConnectionStrings__ets`; see
[Apply migrations](./database#apply-migrations).

**`dotnet ef` is not found.** Install the tool with `dotnet tool install --global dotnet-ef`.
