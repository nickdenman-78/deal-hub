# Architecture Decision Records

Each ADR captures one architectural decision: the context, the options considered, the choice made and
its consequences. They are the decision tree for how the system was shaped — read them when a change
tempts you back onto a path that was already considered and rejected.

ADRs are dated records. When a decision changes, write a new ADR that supersedes the old one and update the
old one's status; do not rewrite history to match.

| # | Title | Status |
|---|---|---|
| [0001](./0001-layered-csprojs-per-module.md) | Layered csprojs per module | Accepted |
| [0002](./0002-endpoints-discovered-by-di.md) | Endpoints discovered by DI, composed per module | Accepted |
| [0003](./0003-module-composition-root-split-in-two.md) | Module composition root split in two | Accepted |
| [0004](./0004-integration-events-as-public-api.md) | IntegrationEvents is the module's public API | Accepted |
| [0005](./0005-module-configuration-sections-not-files.md) | Module configuration sections, not files | Accepted |
| [0006](./0006-keycloak-with-permission-based-authorization.md) | Keycloak with permission-based authorization | Accepted |
| [0007](./0007-aspire-for-local-orchestration.md) | Aspire for local orchestration | Accepted |
| [0008](./0008-cqrs-decorators-registered-once.md) | CQRS decorators registered once, by the host | Accepted |
| [0009](./0009-model-first-ddd-with-context-mapper.md) | Model-first DDD with Context Mapper | Accepted |
| [0010](./0010-persistence-conventions.md) | Persistence conventions (PostgreSQL + EF Core) | Accepted |
| [0011](./0011-messaging-with-wolverine-and-rabbitmq.md) | Messaging with Wolverine and RabbitMQ | Accepted |
| [0012](./0012-caching-with-fusioncache-and-redis.md) | Caching with FusionCache and Redis | Accepted |
| [0013](./0013-event-sourcing-with-marten.md) | Event sourcing with Marten for Deals and Settlement | Accepted |
| [0014](./0014-guid-v7-ids-and-business-references.md) | Guid v7 ids and human-readable business references | Accepted |
| [0015](./0015-scheduling-with-quartz.md) | Scheduling with Quartz.NET, work done by Wolverine | Accepted |
| [0016](./0016-observability-and-health.md) | Observability and health checks | Accepted |
| [0017](./0017-testing-strategy.md) | Testing strategy | Accepted |
| [0018](./0018-archunitnet-for-architecture-tests.md) | ArchUnitNET for architecture tests | Accepted |

## Template

```markdown
# ADR-NNNN — Title in the imperative or as the decision

**Status:** Proposed | Accepted | Superseded by ADR-NNNN

One paragraph stating the decision.

## Why
The problem and the forces. The options considered and why each was rejected.

## Consequences
The rules that follow, what it costs, and what would make us revisit it.
```
