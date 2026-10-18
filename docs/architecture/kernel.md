# Shared kernel contract

`src/core/` holds what every module may depend on. `src/core` depends on nothing in `src/modules`.
This page is the contract the `ddd` skill's templates assume; the types themselves live in code.

## Projects

| Project | Holds |
|---|---|
| `Ets.Core.Domain` | Tactical DDD base types, `Result`/`DomainError`, CQRS interfaces and decorators, `Enumeration<>`, encoded ids, shared-kernel value objects, `IDateTimeProvider` |
| `Ets.Core.Application` | `DateTimeProvider` / `FrozenDateTimeProvider` (market time), holiday calendar service and calculators |
| `Ets.Core.Infrastructure` | `DbContextBase`, `ModelBuilderExtensions.ApplyAllConfigurations<T>()`, `IAudited`/`ISoftDelete` handling (soft delete always with its query filter), `HttpContextUser` (Keycloak claims), `AddCoreAuthorization(permissions)` + permission claims transformation, `GuidV7IdGenerator`, `BusinessRuleViolationException`, Wolverine/Marten/FusionCache/Quartz registration helpers |
| `Ets.Core.Presentation` | `IEndpoint`, `EndpointExtensions` (`AddEndpoints`/`MapEndpoints`), `ResultExtensions.Match`, `ApiResults.Problem`, `GlobalExceptionHandler` |
| `Ets.Core.Services.{Name}` (+ `.Abstractions`) | Shared technical services (cloud storage, notifications); consumers reference `.Abstractions` only |

## Tactical building blocks (`Ets.Core.Domain.Models`)

```
IDomainObject
├── IEntity<TId>       TId Id (strongly typed Guid v7 record)   ← Entity<TId> (identity equality)
│   └── IAggregateRoot                                          ← AggregateRoot<TId> : Entity<TId>
│                                                                  holds raised IDomainEvents
│       └── EventSourcedAggregate<TId>                           ← Apply(event) rebuilds state, Version
└── IValueObject                                                ← records, Enumeration<TValue,TEnum>
```

`AggregateRoot<TId>` exposes `DomainEvents` and `ClearDomainEvents()`; behaviour calls `Raise(event)`.
`EventSourcedAggregate<TId>` routes `Raise` through `Apply`, so state changes only by applying events, and
exposes the uncommitted events for the Marten repository to append.

## Result and errors

- `Result` / `Result<TValue>` with `IsSuccess`, `IsFailure`, `Error`, `Value` (throws on failure).
  `Result<T>` converts implicitly from `T?` (null → `DomainError.NullValue`).
- `DomainError(Code, Description, Type)` with factories `Failure`, `Validation`, `NotFound`, `Problem`,
  `Conflict`; `DomainErrorType` maps to HTTP status in `ApiResults.Problem`.
- Error codes are dotted and lower-case: `deal.status.illegal-transition`, `deal.not-found`.

## CQRS (`Ets.Core.Domain.CQRS`)

- `ICommand`, `ICommand<TResponse>`, `IQuery<TResponse>`, `INotification`.
- `ICommandHandler<TCommand>` → `Task<Result>`; `ICommandHandler<TCommand,TResponse>` and
  `IQueryHandler<TQuery,TResponse>` → `Task<Result<TResponse>>`.
- `services.AddMediator(assemblies)` — Scrutor scan, scoped. `services.AddMediatorPipeline()` — host only,
  once, last: `TryDecorate` validation (FluentValidation) then logging (Serilog).

## Enumerations and ids

- `Enumeration<TValue,TEnum>(TValue Value, string Name)` — abstract record; static cache of the declared
  members; `FromValue`, `FromName`; each concrete enumeration adds `TryParse`. Paired with a plain
  `*Value` enum whose `None = 0`.
- **Ids:** `IIdGenerator.NewId()` returns a Guid v7; each aggregate has a typed id record
  (`public readonly record struct DealId(Guid Value)`).
- **Business references:** `BusinessReference` base record (prefix + Base30 body + Luhn mod 30 check character, so the check is drawn from the same alphabet and catches every single-character error and adjacent transposition) with
  per-type subclasses (`DealReference`, `SettlementReference`) and `TryParse` validating the check digit.
  Values are allocated by an Infrastructure port from a PostgreSQL sequence. **A prefix or base is never
  changed once references have been issued.**

## Time and events

- `IDateTimeProvider` (`Now`, `Today`, in the market timezone — NEM time is AEST, UTC+10, no daylight
  saving). `FrozenDateTimeProvider` for tests.
- `IDomainEvent` — past-tense records in a module's Domain carrying `OccurredAt` (from `IDateTimeProvider`,
  passed in by the behaviour that raises it). Domain events are internal to a module; the unit of work maps
  them explicitly to versioned integration events (IntegrationEvents project) and publishes those through
  the Wolverine outbox. In event-sourced modules the domain events are the persisted stream events.
- `IUnitOfWork.SaveChangesAsync()` — implemented per module over `IDbContextOutbox<TContext>` (EF Core) or a
  Marten session with the Wolverine outbox, so state and outgoing messages commit together.

## Shared-kernel value objects (candidates for ETS)

Money and `Price` ($/MWh), `Volume` (MWh) and capacity (MW), `Percent`, `Factor`, `NEMRegion`
(NSW1, QLD1, VIC1, SA1, TAS1), `StateOrTerritory`, `Term` (named periods — month, quarter, Cal/Fin year
strips), `LoadProfile` (base, peak, morning/evening peak), public holiday calendar, `DateRange`. They are
confirmed by being modelled in `modelling/ddd/shared/shared.cml`, not by appearing here.
