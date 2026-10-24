# The shared kernel

`src/core/` holds what every module may depend on, and depends on nothing in `src/modules`. Its patterns span many
files and are not obvious from any one of them, so learn them before writing a handler. The contract is
`docs/architecture/kernel.md`; this page is the developer's summary.

| Project                   | Holds                                                                                                                  |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `Ets.Core.Domain`         | DDD base types, `Result` and `DomainError`, the CQRS interfaces and decorators, `Enumeration<>`, shared value objects  |
| `Ets.Core.Application`    | `DateTimeProvider` and `FrozenDateTimeProvider` (market time), the holiday calendar service and calculators            |
| `Ets.Core.Infrastructure` | `DbContextBase`, `ApplyAllConfigurations<T>()`, `HttpContextUser`, `AddCoreAuthorization`, `GuidV7IdGenerator`         |
| `Ets.Core.Presentation`   | `IEndpoint`, `AddEndpoints` / `MapEndpoints`, `ResultExtensions.Match`, `ApiResults.Problem`, `GlobalExceptionHandler` |

## Result, not exceptions

Domain behaviour and handlers return `Result` or `Result<T>`. A broken business rule is
`Result.Failure(DomainError.*)`, never a `throw`; exceptions are for programming errors.

```csharp
if (listed is null)
{
    return Result.Failure<AsxProduct>(DomainError.NotFound(
        "deal.asx-product.not-listed",
        $"ASX does not list {productCode}."));
}
```

- `DomainError(Code, Description, Type)` has factories `Failure`, `Validation`, `NotFound`, `Problem` and `Conflict`.
  Codes are dotted and lower case: `deal.asx-product.not-listed`, `deal.concurrency-conflict`.
- `Result<T>` converts implicitly from `T?`, so a handler can `return deal.Value.Id.Value;` and a `null` becomes a
  failure.
- At the edge, an endpoint calls `result.Match(onSuccess, ApiResults.Problem)`. `ApiResults.Problem` maps the error
  type to a status: `Validation` and `Problem` to 400, `NotFound` to 404, `Conflict` to 409, anything else to 500.

::: warning Known exceptions
A few value objects copied from retail-systems (`EmailAddress`, `Term.Create(name)`, `DealName`) still throw
`ArgumentException` on invalid input. `src/CONTEXT.md` lists them under _Flagged ambiguities_.
:::

## CQRS without MediatR

MediatR is commercial from v13, so the kernel has its own small CQRS ([ADR-0008](./decisions#model-and-structure)):

- Requests implement `ICommand`, `ICommand<TResponse>` or `IQuery<TResponse>`.
- Handlers implement `ICommandHandler<TCommand>` (returning `Task<Result>`), `ICommandHandler<TCommand, TResponse>` or
  `IQueryHandler<TQuery, TResponse>` (returning `Task<Result<TResponse>>`).
- **There is no dispatcher.** An endpoint injects the closed handler interface, such as
  `ICommandHandler<CaptureAsxFuturesDealCommand, Guid>`, into its route delegate.

Registration happens in two places, and the split is the point:

| Call                             | Who calls it                                          | What it does                                               |
| -------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `services.AddMediator(assembly)` | Each module's `Add{Module}Application`                | Scrutor scans for handlers and registers them, scoped      |
| `services.AddMediatorPipeline()` | The host, **once, after every module has registered** | `TryDecorate`s every handler with validation, then logging |

Scrutor's decorators apply to whatever is registered when they run. Called per module, the first module's handlers
would be wrapped once per module and later ones would be missed. Validation is registered first, so logging ends up
outermost and records validation failures too. Validators are FluentValidation classes named `{Command}Validator`,
beside their command.

## Enumerations, not C# enums

Domain enumerations derive from `Enumeration<TValue, TEnum>`: an abstract record whose members are nested
`sealed record`s carrying rich properties. Each is paired with a plain `*Value` enum for storage, whose `None` is 0.

```csharp
public abstract record TradeDirection : Enumeration<TradeDirectionValue, TradeDirection>
{
    public static readonly TradeDirection Buy = new BuyDirection();
    public static readonly TradeDirection Sell = new SellDirection();
    // ... Description, TryParse(...)

    private sealed record BuyDirection() : TradeDirection(TradeDirectionValue.Buy, "Buy", "The portfolio bought the contracts");
    private sealed record SellDirection() : TradeDirection(TradeDirectionValue.Sell, "Sell", "The portfolio sold the contracts");
}
```

Resolve a member with `FromValue()`, `FromName()` or the enumeration's own `TryParse()`. Storage always uses the
`*Value` member **name** (`PeakLoad`), never an ordinal or the display name.

## Ids and business references

- **Ids are Guid v7, generated by the domain** through `IIdGenerator` at the moment an entity is created, so events,
  streams and child references have them before anything is saved. Each aggregate has a typed id:
  `public readonly record struct DealId(Guid Value)`. Integration events carry plain `Guid`s
  ([ADR-0014](./decisions#platform)).
- **Business references** are what people quote: a prefix, a Base30 body and a Luhn mod 30 check character, such as
  `ETS-D-` plus a body and check. `BusinessReference` in the kernel composes and validates them; a per-type subclass
  adds the prefix, and an Infrastructure port allocates the number from a PostgreSQL sequence. A reference is never
  derived from the Guid, and **a prefix or base is never changed once references have been issued**.

Captured deals carry no business reference: there is no `DealReference` or `IDealReferenceGenerator`, as
`src/CONTEXT.md` records under _Known gaps_.

## Domain events and integration events

| Domain events                                              | Integration events                                                   |
| ---------------------------------------------------------- | -------------------------------------------------------------------- |
| Past-tense records in a module's `Domain/Events`           | Versioned records in the producer's IntegrationEvents (`{Fact}V{n}`) |
| No `Event` suffix: `AsxFuturesDealCaptured`, `RoleCreated` | Named for the fact and version: `DealConfirmedV1`                    |
| Raised by aggregates; never leave the module               | The module's published contract, consumed by other modules           |
| Carry `OccurredAt` from `IDateTimeProvider`                | Carry plain `Guid`s and primitive values, no kernel types            |

The module's unit of work maps the relevant domain events to integration events and publishes them through the
Wolverine outbox in the same transaction as the state change. In an event-sourced module the domain events **are**
the persisted stream. No module publishes an integration event today: see
[Messaging, caching and scheduling](./messaging-caching-scheduling).

## Aggregates

```text
IDomainObject
├── IEntity<TId>        Entity<TId>: identity equality on a typed id
│   └── IAggregateRoot  AggregateRoot<TId>: holds raised domain events
│                       EventSourcedAggregate<TId>: state changes only by applying events
└── IValueObject        records, Enumeration<TValue, TEnum>
```

- State changes go through the root's methods; there are no public setters, and no `*Manager` or `*Helper` that
  reaches in and mutates.
- Entities have no public constructors: a static factory such as `AsxFuturesDeal.Capture(...)` assigns the id and
  raises the creation event.
- `EventSourcedAggregate<TId>` routes `Raise(event)` through a private `Apply(TEvent)` method, so in-memory state is
  always what the stream would rebuild. An event with no `Apply` method throws rather than being ignored.

## Time and money

- **Time comes from `IDateTimeProvider`**, never `DateTime.Now` or `UtcNow`. `Now` and `Today` are NEM market time
  (AEST, UTC+10, no daylight saving); tests use `FrozenDateTimeProvider`.
- **Money and energy are value objects** with explicit units, `decimal` underneath, rounded only at boundaries:
  `Money` (dollars), `Price` ($/MWh), `Amount` (a value with an `AmountUnit` such as `$/MWh`or`c/kWh`), `Volume`(kW, MW, kWh or MWh),`Percent`and`Factor`. The definitions are in `modelling/ddd/shared/ubiquitous.md`.
