# ADR-0017 — Testing strategy

**Status:** Accepted — architecture-test tooling superseded by [ADR-0018](./0018-archunitnet-for-architecture-tests.md)

| Level | Scope | Tools |
|---|---|---|
| Unit | Aggregates, value objects, event application, handlers with fakes | xUnit v3, **Shouldly**, Bogus |
| Integration | One module through its HTTP endpoints and messaging, real infrastructure | `WebApplicationFactory` + **Testcontainers** (PostgreSQL, Redis, RabbitMQ, Keycloak), Wolverine tracked sessions |
| Architecture | Layer graph, module isolation, conventions | ArchUnitNET + Shouldly, vacuity guards (ADR-0018) |

## Rules

- **Shouldly**, not FluentAssertions (commercial from v8).
- Integration tests run each module against **real PostgreSQL, Redis, RabbitMQ and Keycloak containers**,
  shared per test collection, with the database reset between tests (Respawn-style, schema-scoped).
- Asynchronous outcomes are asserted with Wolverine's `TrackActivity()` / `InvokeMessageAndWaitAsync`,
  never with sleeps.
- Event-sourced aggregates are tested as *given events → when command → then events / result*.
- Time and ids are injected (`IDateTimeProvider`, `IIdGenerator`) so tests are deterministic.
- Per-module test projects (`tests/modules/{module}/Ets{Module}Tests`, `…IntegrationTests`); one solution-wide
  architecture test project.
