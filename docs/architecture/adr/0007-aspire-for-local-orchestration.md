# ADR-0007 — Aspire for local orchestration

**Status:** Accepted

Two projects under `src/aspire/`:

- **`Ets.Aspire.ServiceDefaults`** — cross-cutting wiring every `Ets.Servers.*` host needs: OpenTelemetry
  logs, metrics and traces; liveness and readiness probes; service discovery; standard HTTP resilience.
  Hosts call `builder.AddServiceDefaults()` and `app.MapDefaultEndpoints()`.
- **`Ets.Aspire.AppHost`** — orchestrates PostgreSQL, Redis, RabbitMQ, Keycloak (with the realm export
  imported), Seq and the API host for local development. Hosts consume them through Aspire client
  integrations (`AddNpgsqlDbContext`/`AddNpgsqlDataSource`, `AddRedisClient`, `AddRabbitMQClient`), which
  also register their health checks and telemetry.

They are named `Ets.Aspire.*`, not `Ets.Servers.*`, which is reserved for API hosts.

## Aspire is local orchestration only

A deployed host has no AppHost, so nothing a host needs at runtime may *only* be supplied by the AppHost.
The AppHost may pass connection strings and locations down as environment variables; the host reads them
through its normal configuration chain, which is the same path a deployed host takes.

Containers the AppHost starts are a local convenience and start empty. Anything owned by another system
(an ASX or market-data feed, a legacy database) is referenced, not recreated.

## Serilog and OpenTelemetry both stay

Call `AddServiceDefaults()` **before** `UseSerilog(...)` and pass `writeToProviders: true`, so the
OpenTelemetry provider still sees the events. Serilog gives readable structured logs in the console and Seq;
OpenTelemetry feeds the Aspire dashboard.

## Transitive pinning is disabled for the AppHost only

Aspire hosting packages can require newer `Microsoft.Extensions.*` / SQL client lines than the rest of the
solution. Under `CentralPackageTransitivePinningEnabled` those would force every project up. The AppHost
ships nothing, so it sets `CentralPackageTransitivePinningEnabled=false` locally.

## The CLI bundle, pinned to the SDK

The AppHost sets `AspireUseCliBundle=true`, so the dashboard and the orchestrator (DCP) are resolved from the
Aspire CLI rather than from NuGet packages, and `AspireCliInvocationMode=DnxPinned`, so that CLI is run
through `dnx` at the version paired with the AppHost SDK. The CLI therefore moves with the SDK version in
`global.json` and never depends on which `aspire` happens to be on a developer's `PATH`. `dnx` ships with the
.NET 10 SDK; if it is missing the build reports ASPIRE011, and an unresolved bundle reports ASPIRE009.

## Consequences

- The AppHost SDK version is pinned in `global.json` (`msbuild-sdks`), so the csproj names `Sdk="Aspire.AppHost.Sdk"`
  without a version; keep it in step with the `Aspire.Hosting.*` versions in `Directory.Packages.props`.
- `MapDefaultEndpoints()` provides `/health` and `/alive`. Add module-specific checks to the same builder;
  never a second health-check pipeline.
