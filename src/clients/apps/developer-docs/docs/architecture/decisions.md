# Decision records

Every architectural decision in ETS is an **architecture decision record** (ADR) in `docs/architecture/adr/`: the
context, the options considered, the choice and its consequences. This page gives each one a line so you can find the
right record; read the record itself before changing anything it covers. The repository's index is
`docs/architecture/adr/index.md`.

ADRs are dated records. When a decision changes, a **new** ADR supersedes the old one and the old one's status is
updated; an ADR is never rewritten to match the code. New ADRs take the next free number and follow the template in
the index.

## Model and structure

| ADR  | Decision                                                                                                                                                                                             | File                                              |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| 0001 | **Five projects per module** (Domain, Application, Infrastructure, IntegrationEvents, Presentation), so an assembly boundary, not a convention, stops one module reaching into another.              | `0001-layered-csprojs-per-module.md`              |
| 0002 | **Endpoints are discovered by DI and mapped per module**: one `IEndpoint` class per slice, each module mapping only its own into its own route group. Endpoints have no constructor dependencies.    | `0002-endpoints-discovered-by-di.md`              |
| 0003 | **The composition root is split in two**: `Add{Module}Module` in Infrastructure, `Add{Module}Endpoints` and `Map{Module}Module` in Presentation. Three lines per module in the host, no `IModule`.   | `0003-module-composition-root-split-in-two.md`    |
| 0004 | **IntegrationEvents is the module's public API**: the only project another module or the host may reference. It holds integration events, snapshots and permission names, and stays reference-light. | `0004-integration-events-as-public-api.md`        |
| 0005 | **Configuration is named sections of the standard chain**, bound to options classes with a `SectionName`, defaults in code, validated at startup. No configuration server, no file per module.       | `0005-module-configuration-sections-not-files.md` |
| 0008 | **CQRS decorators are registered once, by the host**, after every module, because open-generic decoration applies to whatever is registered at that moment.                                          | `0008-cqrs-decorators-registered-once.md`         |
| 0009 | **Model-first DDD with Context Mapper**: the CML is the source of truth, one bounded context per module, `extends` becomes C# inheritance, and every new term goes into the context's glossary.      | `0009-model-first-ddd-with-context-mapper.md`     |

## Platform

| ADR  | Decision                                                                                                                                                                                            | File                                                   |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| 0006 | **Keycloak authenticates; ETS authorizes by permission.** Roles and grants live in the Users module; the host declares one policy per permission; endpoints require permissions, never roles.       | `0006-keycloak-with-permission-based-authorization.md` |
| 0007 | **Aspire for local orchestration only**: the AppHost runs PostgreSQL, Redis, RabbitMQ, Keycloak and Seq; ServiceDefaults gives every host OpenTelemetry, health and resilience.                     | `0007-aspire-for-local-orchestration.md`               |
| 0010 | **PostgreSQL with a schema per module and EF Core conventions**: snake_case, `{Entity}Map` per entity, enums as names, explicit column order, children reconciled by id, no temporal tables.        | `0010-persistence-conventions.md`                      |
| 0011 | **Wolverine over RabbitMQ for all module-to-module traffic**, with a transactional outbox and durable inbox in PostgreSQL. Wolverine is the bus, not the mediator; MediatR and MassTransit are out. | `0011-messaging-with-wolverine-and-rabbitmq.md`        |
| 0012 | **FusionCache behind `HybridCache`**, with Redis as L2 and backplane. Cache only what may be stale for a stated period; never serve cached state to a write path.                                   | `0012-caching-with-fusioncache-and-redis.md`           |
| 0013 | **Event sourcing with Marten for Deals and Settlement**: one ancillary store per module in its own schema, stream id = aggregate id, versioned events, optimistic concurrency on every append.      | `0013-event-sourcing-with-marten.md`                   |
| 0014 | **Guid v7 ids generated by the domain**, plus **business references** (prefix, Base30, Luhn check) allocated from a PostgreSQL sequence. A prefix or base never changes once issued.                | `0014-guid-v7-ids-and-business-references.md`          |
| 0015 | **Quartz.NET triggers, Wolverine works**: a job only sends a command carrying its business date; holiday calendars drive trading-day schedules.                                                     | `0015-scheduling-with-quartz.md`                       |
| 0016 | **Serilog to Seq, OpenTelemetry to the Aspire dashboard and Seq**, and `/alive` for liveness and `/health` for readiness. No Jaeger.                                                                | `0016-observability-and-health.md`                     |

## Testing

| ADR  | Decision                                                                                                                                                                                                     | File                                         |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| 0017 | **Unit, integration and architecture tests**: xUnit v3 and Shouldly; integration against real containers via Testcontainers; no sleeps. Its tooling choice for architecture tests is superseded by ADR-0018. | `0017-testing-strategy.md`                   |
| 0018 | **ArchUnitNET for architecture tests**, replacing NetArchTest, because it fails rules whose subjects match nothing and matches namespaces exactly.                                                           | `0018-archunitnet-for-architecture-tests.md` |

## Where each decision shows up on this site

| Page                                                                | ADRs                   |
| ------------------------------------------------------------------- | ---------------------- |
| [Modules and layers](./modules)                                     | 0001, 0002, 0004, 0009 |
| [The host](./host)                                                  | 0003, 0005, 0007, 0008 |
| [The shared kernel](./kernel)                                       | 0008, 0014             |
| [Persistence and event sourcing](./persistence)                     | 0010, 0013             |
| [Messaging, caching and scheduling](./messaging-caching-scheduling) | 0011, 0012, 0015       |
| [Security](./security)                                              | 0006                   |
| [Observability](./observability)                                    | 0016                   |
| [Testing](./testing)                                                | 0017, 0018             |
