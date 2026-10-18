# ADR-0013 — Event sourcing with Marten for Deals and Settlement

**Status:** Accepted

The **Deals** and **Settlement** aggregates are **event sourced**, with **Marten** (MIT) as the event store
on the same PostgreSQL database. Other modules (Risk read models, Users, market and reference data) use EF
Core ([ADR-0010](./0010-persistence-conventions.md)).

## Why

PostgreSQL has no temporal tables, and a trading system must answer "what did this deal look like at
16:00 yesterday, who changed it and why". A deal's life — captured, amended, confirmed, validated, novated,
cancelled — and a settlement's — calculated, approved, invoiced, paid — are naturally sequences of facts.
Event sourcing records them as the source of truth, which gives a complete audit trail and as-at
reconstruction without a second mechanism. Marten keeps that inside PostgreSQL and integrates with
Wolverine's outbox.

The alternatives — an append-only amendment table beside EF Core, or database triggers into history
tables — record *rows*, not *intent*, and drift from the domain model over time.

## Shape

- **One ancillary Marten store per event-sourced module** (`IDealsStore`, `ISettlementStore`), each in its
  own schema (`deals_events`, `settlement_events`), so a module can later move to its own database.
- **Stream id = aggregate id** (Guid v7). Event types are past-tense records in the module's Domain
  (`DealCaptured`, `DealAmended`, `DealConfirmed`) and are **versioned**: an event type is never changed
  after release; a new shape is a new type plus an upcaster.
- **Aggregates** are rebuilt by applying their events (`Apply(DealAmended e)` methods); behaviour methods
  validate, return `Result`, and **raise** new events rather than mutating state directly. The CML remains the
  source of truth for the aggregate's structure and lifecycle.
- **Projections** build read models: inline projections for state the write side needs immediately, async
  projections (Marten's daemon) for query and reporting views. Read models are queried, never mutated by
  handlers.
- **Outgoing integration events** are published through the Marten–Wolverine outbox in the same transaction
  as the appended events ([ADR-0011](./0011-messaging-with-wolverine-and-rabbitmq.md)).
- **Optimistic concurrency** on every append (expected stream version), surfaced as a `Conflict` result.
- **Snapshots** only when a stream's length measurably hurts load time.

## Consequences

- Two persistence models exist in one host. The rule for choosing is per module and recorded in
  `docs/architecture/architecture.md`; a module never mixes both for one aggregate.
- The `ddd` skill's templates include an event-sourced aggregate template.
- Rebuilding async projections is an operational capability that must exist before go-live.
- Personal data in events must be minimal (identity ids, not names), because events are immutable.
