# Architecture

ETS is a **modular monolith**: one deployable API host composed of modules that each own one bounded
context of the trading domain. Modules share a process and a deployment, but not their internals — the
boundaries are enforced by project references and by architecture tests, not by the network.

The structure is inherited from the retail-systems platform, which runs the same architecture in
production. The ADRs in [`adr/`](./adr/) record each decision and the reasoning that carried over.

## Bounded contexts and modules

Each CML `BoundedContext` in `modelling/ddd/` maps to one module. The table is the starting point implied
by the product scope; the CML decides the final set.

| Bounded context | Module | Kind | Owns |
|---|---|---|---|
| `SharedContext` | `src/core/Ets.Core.Domain` | Shared kernel | Money, price, volume, NEM regions, terms/strips, load profiles, holidays, encoded ids |
| `DealCaptureContext` | `Ets.Modules.Deals` | Core | Deal capture and lifecycle for ASX futures/options and OTC swaps, caps and options |
| `SettlementContext` | `Ets.Modules.Settlement` | Core / supporting | Settlement calculation against spot, invoicing data, ASX clearing reconciliation |
| `RiskContext` | `Ets.Modules.Risk` | Core | Positions, mark-to-market, exposure and limits |
| `IdentityContext` | `Ets.Modules.Users` | Generic | Users, roles, permissions; Keycloak provisioning |
| _candidate_ `MarketDataContext` | `Ets.Modules.MarketData` | Supporting | Forward curves, ASX settlement prices, AEMO spot prices |
| _candidate_ `CounterpartyContext` | `Ets.Modules.Counterparties` | Supporting | Counterparties, ISDA/credit terms, clearing participants |

| Module | Persistence |
|---|---|
| Deals, Settlement | Marten event store (ancillary store, own schema) + read-model projections |
| Risk, Users, MarketData, Counterparties | EF Core, own schema |

Cross-module flow is by integration events over **Wolverine + RabbitMQ** with a transactional outbox and
durable inbox: a confirmed deal is published by Deals and consumed by Settlement and Risk into their own
read models. No module reads another's tables.

## Runtime topology

```
                    ┌──────────── Ets.Servers.Api (modular monolith) ─────────────┐
 SPA ──JWT──▶       │ Deals  Settlement  Risk  Users  …   (kernel CQRS in-process)│
 Keycloak ◀─────────│ Wolverine: outbox/inbox ─────▶ RabbitMQ ◀───── workers (EOD MtM)
                    │ Quartz (cron) ─▶ Wolverine commands                         │
                    │ FusionCache L1 ─▶ Redis L2 + backplane                      │
                    └──────┬──────────────────────────────────────────────────────┘
                           ▼
              PostgreSQL: schema per module · marten event schemas · wolverine · quartz
              Serilog + OTLP ─▶ Seq      (Aspire dashboard locally)
```

## The host

`Ets.Servers.Api` is the composition root and the only HTTP entry point.

- **Configuration first**, then service defaults (OpenTelemetry, health, resilience), then Serilog.
- **Three lines per module.** `Add{Module}Module` (Infrastructure), `Add{Module}Endpoints` (Presentation)
  and `Map{Module}Module` (routes). The composition root is split because no single layer may see both
  adapters and endpoints ([ADR-0003](./adr/0003-module-composition-root-split-in-two.md)).
- **CQRS decorators once, after every module**, so each handler is wrapped exactly once
  ([ADR-0008](./adr/0008-cqrs-decorators-registered-once.md)).
- **Authorization from permissions**: Keycloak authenticates, the Users module supplies permission claims,
  and the host declares one policy per permission from each module's published catalogue
  ([ADR-0006](./adr/0006-keycloak-with-permission-based-authorization.md)).
- **Wolverine after the modules**: conventional discovery off, each module's Infrastructure assembly
  included, each module's DbContext / Marten store enrolled for the outbox
  ([ADR-0011](./adr/0011-messaging-with-wolverine-and-rabbitmq.md)).
- **One OpenAPI document per module** (plus `host` for the host's own routes), so generated clients follow
  the module boundary. Scalar is the reference UI and must be told every document name.

Middleware order: exception handler → default endpoints → request logging → CORS → authentication →
authorization → module routes.

## The shape of a module

Every module is five projects with a fixed reference graph
([ADR-0001](./adr/0001-layered-csprojs-per-module.md)):

| Project | Owns | References |
|---|---|---|
| `Domain` | Aggregates, entities, value objects, domain events, repository ports | `Ets.Core.Domain` |
| `Application` | Commands, queries, handlers, validators, application ports | Domain, `Ets.Core.Domain` |
| `Infrastructure` | Adapters: persistence, external systems; service-side composition root | Application, IntegrationEvents, `Ets.Core.Infrastructure` |
| `Presentation` | Endpoints (one class per slice), request/response DTOs; route-side composition root | Application, `Ets.Core.Presentation` |
| `IntegrationEvents` | The public API: integration events, snapshots, permission names, configuration contract | nothing |

The host references a module's Infrastructure, Presentation and IntegrationEvents — never its Application
or Domain. Another module may reference only its IntegrationEvents
([ADR-0004](./adr/0004-integration-events-as-public-api.md)).

> **Forbidden references** — `Application → Infrastructure`, `Presentation → Infrastructure`,
> `Infrastructure → Presentation`, a Domain depending on any other layer or on EF Core / ASP.NET Core, and
> any module depending on another module's internals. All fail `tests/architecture/EtsArchitectureTests`.

### Inside a module

```
src/modules/deals/
  Ets.Modules.Deals.Domain/
    Models/            aggregates and entities
    ValueObjects/      value objects, Enumeration<> types and their *Value enums
    Events/            domain events (past tense)
    Repositories/      repository ports
  Ets.Modules.Deals.Application/
    {Aggregate}s/{UseCase}/   {UseCase}Command|Query, {UseCase}CommandHandler, {UseCase}CommandValidator
    ServiceCollectionExtensions.cs   Add{Module}Application → AddMediator + AddValidatorsFromAssembly
  Ets.Modules.Deals.Infrastructure/
    {Module}Module.cs  service-side composition root
    Persistence/       {Module}DbContext, Configuration/{Entity}Map, Entities/Db*, Migrations/, repositories
                       (or Marten store, projections and event-stream repositories for event-sourced modules)
    Messaging/         Wolverine consumers of other modules' integration events; outgoing event mapping
    Scheduling/        Quartz jobs that send Wolverine commands
  Ets.Modules.Deals.Presentation/
    {Aggregate}s/{UseCase}.cs   one IEndpoint per slice, mirroring Application's folders
    {Module}Endpoints.cs, OpenApiDocuments.cs, Tags.cs, {Module}AuthorizationPolicies.cs
  Ets.Modules.Deals.IntegrationEvents/
    Authorization/{Module}Permissions.cs, versioned integration events, snapshots
```

Every layer project has an `AssemblyReference` class — a compile-time handle for DI scanning and for the
architecture tests, which would otherwise fall back to string matching and quietly assert nothing.

## Architecture tests

`tests/architecture/EtsArchitectureTests` (ArchUnitNET + Shouldly, [ADR-0018](./adr/0018-archunitnet-for-architecture-tests.md)) is what makes the boundaries real:

- **Layer dependencies** — the graph above, per module, plus "Domain must not depend on EF Core or
  ASP.NET Core".
- **Module isolation** — no layer of a module depends on another module's namespace except its
  `IntegrationEvents`; `IntegrationEvents` depends on none of its own module's layers. **Planned modules are
  listed by namespace before they exist**, so the rule applies from their first line of code.
- **Endpoint conventions** — endpoints are `internal sealed` with a parameterless constructor; handlers are
  `sealed` and live only in Application.
- **Infrastructure isolation** — Domain and Application reference neither Wolverine, Marten, Quartz,
  FusionCache nor Npgsql.
- **Naming and placement** — `{UseCase}Command`/`Query`, handlers named `{Request}Handler` beside their
  request, validators `{T}Validator`, domain events without an `Event` suffix in `Domain.Events`, repository
  ports in `Domain.Repositories`, EF maps `{Entity}Map` in `Persistence.Configuration`, rows `Db{Entity}`,
  integration events `{Fact}V{n}`, `*Options` with a `SectionName`, consumers in `Infrastructure.Messaging`,
  endpoints mirroring an Application use case, and each module's three composition methods.
- **Slice independence** — use-case slices in Application and Presentation do not depend on each other,
  which also rules out cycles between them.
- **Visibility** — handlers, validators, endpoints, EF Core maps and `Db*` rows are `internal`; callers
  depend on the handler interface, never a concrete handler.
- **Colocation** — a use case's command or query, handler, validator and response share one folder (the
  response may sit one level up when several use cases of an aggregate return it).
- **Entities have no public constructors** — a static factory assigns the id and raises the creation event.
- **Canaries** — each dependency rule's namespace strings are pointed at a dependency known to exist and must
  catch it, so a typo or a renamed namespace turns a test red instead of making a rule assert nothing.
- **Convention rules skip, visibly, while their subject does not exist** (no endpoints yet, no events yet).
- **Every rule guards against vacuity** (`ShouldNotBeVacuous`): a predicate over an empty list passes, so a
  rule whose inputs went missing would otherwise look identical to one that holds.

## Naming

| Kind | Pattern | Path |
|---|---|---|
| API host | `Ets.Servers.{Name}` | `src/hosts/` |
| Shared kernel | `Ets.Core.{Domain,Application,Infrastructure,Presentation}` | `src/core/` |
| Shared service | `Ets.Core.Services.{Name}` (+ `.Abstractions` for interfaces only) | `src/core/services/{Name}/` |
| Module layer | `Ets.Modules.{Module}.{Layer}` | `src/modules/{module}/` |
| Module adapter project | `Ets.Modules.{Module}.Infrastructure.Services.{System}` | `src/modules/{module}/services/` |
| Aspire | `Ets.Aspire.AppHost`, `Ets.Aspire.ServiceDefaults` | `src/aspire/` |
| Test project | `Ets{Area}Tests` | `tests/{area}/` |

## Local development

`Ets.Aspire.AppHost` orchestrates PostgreSQL, Redis, RabbitMQ, Keycloak, Seq and the API host for local development
([ADR-0007](./adr/0007-aspire-for-local-orchestration.md)). Aspire is local orchestration only; a deployed
host takes the same code path without it.
