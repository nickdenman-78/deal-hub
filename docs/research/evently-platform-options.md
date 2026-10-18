# ETS platform options — what Evently does, and the alternatives

Analysis of Milan Jovanović's **Evently** (modular-monolith course, `Final/evently`) as a reference for ETS,
with the alternatives for each pattern. Already decided for ETS: **PostgreSQL**, **EF Core**, **Redis** for
caching, **.NET Aspire** for orchestration, **Serilog + Seq** for logging, **no MediatR / MassTransit**
(both now commercial).

## 1. Evently at a glance

.NET 8, four modules (Users, Events, Ticketing, Attendance), each split into Domain / Application /
Infrastructure / Presentation / IntegrationEvents projects, plus `Common.{Domain,Application,Infrastructure,Presentation}`.
Per-module Unit, Integration and Architecture test projects, plus solution-wide architecture and
integration tests. `TreatWarningsAsErrors=true`, `AnalysisMode=All`, SonarAnalyzer.

| Concern | What Evently uses |
|---|---|
| In-process CQRS | **MediatR 12** (`ICommand`/`IQuery` over `IRequest`), pipeline behaviours: exception wrapping → request logging (pushes `Module` into Serilog `LogContext`, tags the OTel `Activity`) → FluentValidation (returns `Result.ValidationFailure`, no throw) |
| Messaging | **MassTransit 8** behind an `IEventBus` facade — **in-memory transport** (no broker in the final code); kebab-case endpoints |
| Saga | MassTransit state machine (`CancelEventSaga`, composite event for "payments refunded + tickets archived") persisted in **Redis** |
| Outbox | **Hand-rolled.** `SaveChangesInterceptor` turns entity domain events into `outbox_messages` rows (jsonb) in the same transaction; a **Quartz** job per module polls (`FOR UPDATE`, batch, interval from config) and dispatches to domain-event handlers |
| Inbox | **Hand-rolled.** A MassTransit consumer per integration event writes `inbox_messages`; a Quartz job per module dispatches to integration-event handlers |
| Idempotency | Scrutor decorators `IdempotentDomainEventHandler` / `IdempotentIntegrationEventHandler` record `(message id, handler name)` in `*_message_consumers` tables and skip repeats |
| Persistence | EF Core + Npgsql, **schema per module**, per-module migrations history table, **snake_case** (`EFCore.NamingConventions`), `IUnitOfWork` = DbContext; **Dapper** + `NpgsqlDataSource` for every query handler |
| Caching | `ICacheService` over `IDistributedCache` (StackExchange.Redis, System.Text.Json); falls back silently to in-memory if Redis is unreachable at startup |
| Logging | Serilog configured from `appsettings` (`ReadFrom.Configuration`) → Console + **Seq**; request logging; middleware pushes `TraceId` into `LogContext` |
| Tracing | OpenTelemetry (ASP.NET Core, HttpClient, EF Core, Npgsql, Redis, MassTransit) → OTLP → **Jaeger** |
| Health checks | Xabaril `AspNetCore.HealthChecks.NpgSql/Redis/Uris` (+ custom Keycloak check), `UIResponseWriter` JSON at `/health` |
| AuthN | **Keycloak** (JWT bearer); Users module provisions users in Keycloak via its admin REST API |
| AuthZ | **Permission-based**: roles/permissions stored in the Users schema; `IClaimsTransformation` adds permission claims per request; a **dynamic `IAuthorizationPolicyProvider`** synthesises a policy for any permission name |
| API | Minimal APIs, one `IEndpoint` per slice, assembly-scanned; Swashbuckle |
| Ids | `Guid` (`Guid.NewGuid()`), events carry `Id` + `OccurredOnUtc` |
| Module config | `modules.{name}.json` + `modules.{name}.Development.json` per module loaded by the host |
| Testing | xUnit 2, **FluentAssertions 6**, **Bogus**, **Testcontainers** (PostgreSQL, Redis, Keycloak) + `WebApplicationFactory`, NetArchTest; a `Poller` for eventual-consistency assertions |
| Local env | docker-compose: Postgres 17, Keycloak, Seq, Redis, Jaeger |

### Worth adopting (fits ETS ADRs)

- **Domain events raised on entities, persisted to an outbox in the same transaction, dispatched after commit.**
  ETS's retail-derived kernel holds no event collection and never dispatches — Evently's shape fixes that.
- **Idempotent consumers** keyed on (message id, handler) — essential once anything retries.
- **Integration events carry `Id` and `OccurredOnUtc`**; consumers translate them into their own commands.
- **Schema per module + per-module migrations history table** in one PostgreSQL database.
- **Request logging that pushes `Module` and `TraceId` into the log context** and tags the trace.
- **Validation returning `Result` failures instead of throwing.**
- **Per-module test projects** (unit, integration with Testcontainers, architecture) alongside solution-wide ones.
- **Snake_case naming** for PostgreSQL.

### Not worth adopting (conflicts or defects)

- `modules.*.json` per module — rejected by ETS ADR-0005 (configuration sections with `SectionName`, validated on start).
- Infrastructure → Presentation reference — rejected by ADR-0003 (composition root split in two).
- Dynamic policy provider that synthesises a policy for any name — rejected by ADR-0006 (a typo becomes a permissive route); permissions are kept, but declared.
- **`TypeNameHandling.All`** on Newtonsoft for outbox/inbox payloads — a known deserialisation-attack vector; use System.Text.Json with an explicit type registry.
- Silent fallback to in-memory cache when Redis is down — hides a production fault; fail health instead.
- `ExceptionHandlingPipelineBehavior` that wraps every exception — the global exception handler already does this.
- `DateTime.UtcNow` inside `DomainEvent` — ETS uses `IDateTimeProvider`.
- FluentAssertions — v8+ is commercial (Xceed); ETS already uses Shouldly.
- Polling outbox with one Quartz job per module and copy-pasted processor classes per module — a library does this better.

## 2. ETS consequences of choosing PostgreSQL

ADR-0010 and the kernel were originally written against SQL Server; ADR-0010 now covers these points:

- **No system-versioned temporal tables in PostgreSQL.** Deal and settlement history needs another mechanism:
  history tables populated by triggers, an `IAudited` + append-only amendment model, or **event sourcing**
  (see §8).
- **snake_case** naming convention, `jsonb` for payloads, `NpgsqlDataSource` registered once.
- Enum-as-string convention and explicit column order still apply (Npgsql honours `HasColumnOrder` on create).

## 3. Mediator / in-process CQRS

| Option | Licence | Notes |
|---|---|---|
| **Custom kernel** (`ICommand`/`IQuery`/handlers + Scrutor decorators, as in ETS ADR-0008) | own code | Already specified. Explicit, no magic, endpoints inject closed handlers. You own ~200 lines. |
| **Wolverine** as mediator (`IMessageBus.InvokeAsync<T>`) | MIT | Same library as messaging; middleware replaces decorators; FluentValidation middleware available; runtime code generation (pre-generate for production). Convention-based handlers — less explicit than interfaces. |
| **Mediator** (martinothamar, source-generated, v3) | MIT | Closest drop-in for MediatR, compile-time wiring, very fast. Another dependency for what the kernel already does. |
| Plain application services | — | Simplest; loses uniform cross-cutting pipeline. |
| MediatR 13+ | RPL-1.5 / commercial (free under US$5M revenue) | Excluded by you. 12.5 stays Apache but is unmaintained. |

## 4. Messaging, outbox and inbox

| Option | Licence | Outbox/inbox | RabbitMQ | Sagas | Modular-monolith fit |
|---|---|---|---|---|---|
| **Wolverine** (JasperFx) | MIT (paid support/consulting; CritterWatch monitoring is a separate product) | Durable outbox **and** inbox, EF Core integration, **scrapes domain events from the change tracker**, ancillary store per DbContext/module, PostgreSQL message storage | Yes (also ASB, Kafka, SQS…) | Yes (EF Core or Marten persisted) | Explicit guidance: separate DbContext per module, `MultipleHandlerBehavior.Separated`, `MessageIdentity.IdAndDestination`, durable local queues, OTel spans. 5.x stable, 6.0 in alpha. |
| **Hand-rolled** (Evently style) + RabbitMQ.Client | own code | You write both, plus retry, poison handling, dead-letter, ordering | Raw client | Write your own | Full control, most code to own and test. |
| **CAP** (DotNetCore.CAP 10.x) | MIT | Publish-side outbox + received-message table, EF Core transactions, built-in dashboard | Yes (+ Kafka, ASB, NATS…) | No | Event bus only; no mediator, no sagas; topic-group subscription model. |
| **Rebus** | MIT (Fleet Manager UI is paid Rebus Pro) | Outbox exists (verify PostgreSQL support before relying on it) | Yes | Yes | Mature, small API; less modular-monolith tooling. |
| **Brighter** (+ Darker) | MIT | Outbox/inbox incl. PostgreSQL | Yes | No first-class sagas | Command processor + bus; more ceremony. |
| MassTransit 9 | Commercial (Massient) | — | — | — | Excluded by you. v8 stays Apache but is no longer the maintained line. |

**Does ETS need RabbitMQ inside the monolith?** With a library outbox, modules can talk over **durable local
queues** (persisted in PostgreSQL) with no broker. A broker earns its place for: (a) work distributed across
several host instances or separate worker processes (e.g. a risk/MtM calculation worker), (b) external
consumers/producers (market-data feeds, downstream systems), (c) making later extraction of a module a
config change.

## 5. Scheduling (EOD mark-to-market, settlement runs, outbox polling)

| Option | Licence | Notes |
|---|---|---|
| **Quartz.NET** | Apache-2.0 | Cron, calendars (holiday-aware!), clustered PostgreSQL job store. Evently uses it. |
| **Wolverine scheduled messages** | MIT | Delayed/scheduled delivery, durable; not a cron calendar. Pairs with Quartz for cron. |
| **TickerQ** | open source | Newer, EF Core-backed, dashboard; less proven. |
| **Hangfire** | LGPL + paid Pro | Dashboard; Pro features paid. |

## 6. Caching (Redis decided)

| Option | Licence | Notes |
|---|---|---|
| **HybridCache** (`Microsoft.Extensions.Caching.Hybrid`) + Redis L2 | MIT | L1 memory + L2 Redis, stampede protection, tags. No built-in cross-instance L1 invalidation. |
| **FusionCache** + Redis + backplane | MIT | Fail-safe (serve stale on failure), eager refresh, timeouts, **Redis backplane** keeps L1 caches in sync across instances; can be exposed *as* `HybridCache`. |
| `IDistributedCache` + own `ICacheService` (Evently) | MIT | Simple; no L1, no stampede protection. |

Market data (forward curves, ASX settlement prices) is the obvious cache workload; staleness rules matter
for risk, so fail-safe behaviour must be a deliberate choice per cache entry.

## 7. Observability and health

- **Logs:** Serilog → Seq (decided). Keep `writeToProviders: true` so OTel/Aspire dashboard also sees them.
- **Traces/metrics:** OTel → Aspire dashboard locally. Seq ingests **OTLP traces and logs**, so Seq can
  replace Jaeger as the persistent trace store — one less container.
- **Health:** Aspire client integrations (Npgsql/EF Core, StackExchange.Redis, RabbitMQ) register health
  checks automatically; Xabaril packages for anything else; Wolverine exposes broker health probes.
  Separate liveness (`/alive`) from readiness (`/health`). HealthChecks UI is optional.

## 8. Event sourcing — Marten (PostgreSQL)

Marten (MIT, Critter Stack with Wolverine) turns PostgreSQL into a document DB + event store. For a trading
system the deal lifecycle (capture → amend → confirm → validate → cancel/novate) and settlement are
naturally event streams, giving a complete audit trail and as-at reconstruction — which also answers the
"no temporal tables in PostgreSQL" gap. Trade-off: you decided EF Core; Marten would be **in addition**
(e.g. for Deals only), adds projection design and a second persistence model.

## 9. Identity

| Option | Notes |
|---|---|
| **Entra ID** with app roles (the original retail-derived choice) | Managed; roles in token; enumerable declared policies. Requires an Entra tenant. |
| **Keycloak** (Evently) | Self-hosted, Apache-2.0, runs in Aspire/containers, realm roles in token; you operate it. |
| Permissions in the app DB + claims transformation (Evently) | Fine-grained, changeable at runtime; one DB hit per request unless cached; synthesised policies (rejected in ADR-0006) unless the permission catalogue is declared. |

## 10. Smaller choices

- **Ids:** Guid v7 (`Guid.CreateVersion7()`, time-ordered, index-friendly; natural for messages) vs encoded
  `long` (ETS kernel, human-readable references). A hybrid — Guid v7 keys + a human-readable deal reference
  value object — is common.
- **Reads:** Dapper raw SQL (Evently) vs EF Core `AsNoTracking` projections.
- **Assertions:** Shouldly (BSD) or AwesomeAssertions (Apache fork of FluentAssertions 7).
- **Integration tests:** Testcontainers vs `Aspire.Hosting.Testing` (spins up the real AppHost).
- **OpenAPI UI:** built-in OpenAPI + Scalar (ETS) vs Swashbuckle (Evently).

## 11. Outcome

| Area | Decision | ADR |
|---|---|---|
| Persistence | PostgreSQL + EF Core, schema per module; EF Core projections with Dapper allowed for heavy reads | [0010](../architecture/adr/0010-persistence-conventions.md) |
| Messaging | Wolverine over RabbitMQ for all module-to-module traffic; outbox + inbox in PostgreSQL | [0011](../architecture/adr/0011-messaging-with-wolverine-and-rabbitmq.md) |
| In-process CQRS | Keep the ETS kernel handlers + decorators | [0008](../architecture/adr/0008-cqrs-decorators-registered-once.md) |
| Caching | FusionCache + Redis + backplane behind `HybridCache` | [0012](../architecture/adr/0012-caching-with-fusioncache-and-redis.md) |
| Identity | Keycloak + permissions owned by a Users module, declared policies | [0006](../architecture/adr/0006-keycloak-with-permission-based-authorization.md) |
| History | Marten event sourcing for Deals and Settlement | [0013](../architecture/adr/0013-event-sourcing-with-marten.md) |
| Ids | Guid v7 + human-readable business references | [0014](../architecture/adr/0014-guid-v7-ids-and-business-references.md) |
| Scheduling | Quartz.NET triggering Wolverine commands | [0015](../architecture/adr/0015-scheduling-with-quartz.md) |
| Observability | Serilog + OpenTelemetry → Seq; Aspire dashboard locally | [0016](../architecture/adr/0016-observability-and-health.md) |
| Testing | xUnit v3, Shouldly, Testcontainers, Bogus | [0017](../architecture/adr/0017-testing-strategy.md) |
