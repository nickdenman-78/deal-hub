# CML → C# Mapping

## BoundedContext → module

Each CML `BoundedContext` maps to one module. **The module folder is not mechanically derived from the
context name** (`DealCaptureContext` lives in `src/modules/deals/`, not `dealcapture/`). Check this table
before creating anything, and add a row when a new context is modelled.

| CML bounded context | Kind | Target location | Root namespace |
|---|---|---|---|
| `SharedContext` | Shared kernel (`[SK]`) | `src/core/Ets.Core.Domain` | `Ets.Core.Domain` |
| `DealCaptureContext` | Core | `src/modules/deals/` | `Ets.Modules.Deals.*` |
| `SettlementContext` | Core / supporting | `src/modules/settlement/` | `Ets.Modules.Settlement.*` |
| `RiskContext` | Core | `src/modules/risk/` | `Ets.Modules.Risk.*` |
| `CustomerContext` | Upstream of `DealCaptureContext` (`[U,OHS,PL]`) | none yet — not modelled | — |
| _new_ `{Name}Context` | — | `src/modules/{name}/` | `Ets.Modules.{Name}.*` |

The rows below `SharedContext` are proposed from the product scope; confirm each when its CML exists.
A context that is modelled only as an upstream reference (for example market or counterparty master data
consumed through an ACL) may have **no module at all** — record that here explicitly rather than
generating a tree for it.

Rules:

- Anything reachable from another context via `[SK]<->[SK]`, and common value objects / basic types,
  belongs in the **shared kernel** (`src/core/Ets.Core.Domain`), not a feature module.
- A downstream context with ACL (`[D,ACL]<-[U,OHS,PL]`) references only the upstream module's
  `IntegrationEvents` (its published language), never its internals.
- **A module is five csprojs**: `Ets.Modules.{Module}.{Domain,Application,Infrastructure,IntegrationEvents,Presentation}`
  with the reference graph enforced by `tests/architecture/EtsArchitectureTests` (see `CLAUDE.md`).
  Aggregates, entities, value objects, domain events and repository ports go in `Domain`; commands,
  queries, handlers and validators in `Application`.
- Inside `Domain`: aggregates and entities in `Models/`, value objects and enumerations in `ValueObjects/`,
  domain events in `Events/`, repository ports in `Repositories/`. In `Application`, a slice is a folder
  per use case under `{Aggregate}s/` (e.g. `Deals/ConfirmDeal/`) holding the command, handler and
  validator. Presentation mirrors the Application folders one directory across.
- A CML `Module` inside a `BoundedContext` becomes a sub-namespace/folder in the module's Domain **only when
  a context has more than one**. A context with a single `Module` (`DealCaptureContext`'s `DealCapture`)
  keeps `Models/`, `ValueObjects/` and `Events/` at the Domain root: the architecture tests require domain
  events in `{Module}.Domain.Events`.
- One aggregate may span several CML files. Keep one entry-point file and place related entities, value
  objects, enums, commands, events and services in hierarchy-mirroring siblings
  (`deal.cml` → `deal.deal.cml`, `deal.exchange-deal.cml`, `deal.otc-deal.cml`).

## Element → C# construct

| CML element | C# construct | Base / interface | Notes |
|---|---|---|---|
| `BoundedContext` | module (five projects) | — | see table above |
| `Module` | namespace / folder | — | groups aggregates within a context |
| `Aggregate` (root entity) — EF Core module | `abstract`/`sealed` class | `: AggregateRoot<TId>` | one root per aggregate; repository entry point |
| `Aggregate` (root entity) — Deals, Settlement | `abstract`/`sealed` class | `: EventSourcedAggregate<TId>` | state rebuilt by `Apply` methods; behaviour raises events |
| `Entity` | class | `: Entity<TId>` | identity equality by typed Guid v7 id |
| `ValueObject` (data) | `sealed record` | `: IValueObject` | immutable; value equality |
| id of an aggregate/entity | `readonly record struct {Name}Id(Guid Value)` | — | Guid v7 from `IIdGenerator` |
| business reference (`dealReference`) | `sealed record` | `: BusinessReference` | prefix + Base30 + Luhn; allocated by an Infrastructure port |
| `enum` (incl. `aggregateLifecycle`) | `Enumeration<TValue,TEnum>` **+** `*Value` enum | abstract record | never a plain C# enum in the domain |
| `Entity B extends A` | subclass; `A` becomes `abstract` | `: A` | keep the hierarchy |
| `DomainEvent` | `sealed record` | `: IDomainEvent` | past tense; carries `OccurredAt`; in event-sourced modules these are the stream events (versioned, never changed once released) |
| command / domain service operation | `ICommand` / `ICommand<T>` + handler + validator | `ICommandHandler<..>` | returns `Result` / `Result<T>` |
| query | `IQuery<T>` + handler | `IQueryHandler<..>` | returns `Result<T>` |
| `BasicType` (`Money`, `Price`, `Volume`, `Percent`, `Factor`) | existing kernel value objects | `: IValueObject` | reuse; do not redeclare per module |
| `Repository` | interface in `Domain/Repositories` | — | implemented in Infrastructure |

## Inheritance

CML `extends` chains are reproduced as C# inheritance, **not** flattened into a discriminator property.
Trading products are the canonical case — e.g. `Deal` → `ExchangeDeal` (ASX futures and options) /
`OtcDeal` → `Swap`, `Cap`, `OtcOption` — each level owning only what the CML gives it.

- Intermediate CML entities become `abstract` classes; only leaves are `sealed`.
- A discriminator value object may coexist with the tree when the CML models both (e.g. a `ProductType`
  enumeration whose properties drive behaviour) — keep both.
- The root's `Add*` method is a **factory** that switches on the enum's `*Value` and returns the matching
  subtype. Switch on `productType.Value`, not on the enumeration reference.
- Child collections live on the subtype that owns them in CML.
- Persistence maps the tree table-per-hierarchy, mirroring the domain types (see ADR-0010).

## Relationship semantics

- `[SK]<->[SK]` — shared kernel: shared types in `src/core/Ets.Core.Domain`; both contexts depend on it.
- `[U]` upstream / `[D]` downstream — the downstream references the upstream's published contracts
  (IntegrationEvents), never the reverse.
- `exposedAggregates` on a relationship names the aggregates that form the upstream's published contract;
  the downstream gets snapshots of them, not the aggregates.

## Naming

- Module folders and namespaces come from the table above, not from the context name.
- Aggregate `Deal` → `Deal : EventSourcedAggregate<DealId>`; id `DealId(Guid Value)`; reference
  `DealReference : BusinessReference`.
- CML `enum DealStatus { aggregateLifecycle PENDING, CONFIRMED, VALIDATED, CANCELLED }` →
  `DealStatus : Enumeration<DealStatusValue, DealStatus>` plus
  `enum DealStatusValue { None = 0, Pending = 1, Confirmed = 2, Validated = 3, Cancelled = 4 }`.
- CML `UPPER_SNAKE` enum members become PascalCase `*Value` members; the enumeration's display `Name` is
  human prose ("Peak load") and is never what persistence stores.
- Where two contexts use the same word differently (e.g. "position", "settlement"), use context-specific
  types and alias usings in any file that touches both.

## Things that look like violations but are not

- Allocating a **business reference** through an Infrastructure port (`IDealReferenceGenerator`) during the
  command is the sanctioned route — references come from a database sequence, ids from `IIdGenerator`.
- A Wolverine handler in a module's Infrastructure that consumes another module's integration event is not
  a misplaced CQRS handler — it is an inbound adapter that translates the event into this module's command.
- A CML `required` attribute may be nullable in C# when imported/legacy data can lack it. Enforce it in the
  command's validator instead, and say so in a comment.
