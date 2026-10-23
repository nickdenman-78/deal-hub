# C# Templates (house style)

All templates follow the house style: file-scoped namespaces, block-bodied members, no trailing commas,
`[UsedImplicitly]` on DI/reflection-only members, typed Guid v7 ids, `Result` for failures. Domain names are
**illustrative** — the CML decides the real ones.

---

## Typed id and business reference

```csharp
namespace Ets.Modules.Deals.Domain.ValueObjects;

public readonly record struct DealId(Guid Value)
{
    public override string ToString()
    {
        return Value.ToString();
    }
}
```

```csharp
using Ets.Core.Domain.ValueObjects;

namespace Ets.Modules.Deals.Domain.ValueObjects;

// "ETS-D-" + Base30 sequence + Luhn check digit. Allocated by IDealReferenceGenerator (Infrastructure).
public sealed record DealReference : BusinessReference
{
    public const string Prefix = "ETS-D-";

    private DealReference(string value) : base(value)
    {
    }

    public static Result<DealReference> Create(string value)
    {
        return IsValid(Prefix, value)
            ? new DealReference(value)
            : Result.Failure<DealReference>(DomainError.Validation("deal.reference.invalid", $"'{value}' is not a deal reference."));
    }
}
```

---

## Event-sourced aggregate root (Deals, Settlement)

CML:

```cml
Aggregate Deal {
  Entity Deal {
    aggregateRoot
    - DealReference dealReference
    - @DealStatus status required
    - @NEMRegion region required
    def @Result confirm();
  }
}
```

Events (`Domain/Events/`) — immutable, past tense, versioned by type name; never changed once released:

```csharp
namespace Ets.Modules.Deals.Domain.Events;

public sealed record DealCaptured(
    DealId DealId,
    DealReference Reference,
    NEMRegion Region,
    DateTimeOffset OccurredAt) : IDomainEvent;

public sealed record DealConfirmed(DealId DealId, Guid ConfirmedBy, DateTimeOffset OccurredAt) : IDomainEvent;
```

Aggregate (`Domain/Models/Deal.cs`) — behaviour validates and raises; only `Apply` changes state:

```csharp
using Ets.Core.Domain.Models;

namespace Ets.Modules.Deals.Domain.Models;

public abstract class Deal : EventSourcedAggregate<DealId>
{
    public DealReference Reference { get; private set; } = null!;

    public NEMRegion Region { get; private set; } = NEMRegion.None;

    public DealStatus Status { get; private set; } = DealStatus.None;

    public Result Confirm(Guid confirmedBy, IDateTimeProvider clock)
    {
        if (Status != DealStatus.Pending)
        {
            return Result.Failure(DomainError.Conflict(
                "deal.status.illegal-transition",
                $"A deal in status '{Status}' cannot be confirmed."));
        }

        Raise(new DealConfirmed(Id, confirmedBy, clock.Now));
        return Result.Success();
    }

    [UsedImplicitly]
    protected void Apply(DealCaptured @event)
    {
        Id = @event.DealId;
        Reference = @event.Reference;
        Region = @event.Region;
        Status = DealStatus.Pending;
    }

    [UsedImplicitly]
    protected void Apply(DealConfirmed @event)
    {
        Status = DealStatus.Confirmed;
    }
}
```

> `Raise` appends the event to the uncommitted list **and** calls the matching `Apply`, so in-memory state
> is always what the stream would rebuild. The repository appends uncommitted events with the expected
> stream version (optimistic concurrency → `Conflict`).

---

## State-based aggregate root (EF Core modules)

```csharp
using Ets.Core.Domain.Models;

namespace Ets.Modules.Risk.Domain.Models;

public sealed class Position : AggregateRoot<PositionId>
{
    private Position(PositionId id, string portfolio, NEMRegion region) : base(id)
    {
        Portfolio = portfolio;
        Region = region;
    }

    public string Portfolio { get; }

    public NEMRegion Region { get; }

    public Volume NetVolume { get; private set; } = Volume.Zero;

    public static Position Open(IIdGenerator ids, string portfolio, NEMRegion region)
    {
        return new Position(new PositionId(ids.NewId()), portfolio, region);
    }

    public Result Book(Volume volume, IDateTimeProvider clock)
    {
        NetVolume += volume;
        Raise(new PositionChanged(Id, NetVolume, clock.Now));
        return Result.Success();
    }
}
```

---

## Entity hierarchy (from CML `extends`)

Intermediate levels are `abstract`, leaves `sealed`, and the level that owns a child collection in CML owns
it here. Do not collapse the chain into one class with a discriminator.

```csharp
public abstract class OtcDeal : Deal
{
    public CounterpartyId CounterpartyId { get; private set; }
}

public sealed class Swap : OtcDeal
{
    private readonly List<SwapLeg> _legs = [];

    public IReadOnlyList<SwapLeg> Legs => _legs.AsReadOnly();

    public Result AddLeg(IIdGenerator ids, Term term, Volume volume, Price price, IDateTimeProvider clock)
    {
        if (_legs.Any(leg => leg.Term.Overlaps(term)))
        {
            return Result.Failure(DomainError.Conflict(
                "swap.leg.overlapping-term",
                $"A leg already covers part of {term}."));
        }

        Raise(new SwapLegAdded(Id, new SwapLegId(ids.NewId()), term, volume, price, clock.Now));
        return Result.Success();
    }

    [UsedImplicitly]
    private void Apply(SwapLegAdded @event)
    {
        _legs.Add(new SwapLeg(@event.LegId, @event.Term, @event.Volume, @event.Price));
    }
}
```

A factory selects the subtype from the CML enum's `*Value` and raises the creation event:

```csharp
public static Result<OtcDeal> Capture(OtcProductType productType, /* … */)
{
    OtcDeal deal = productType.Value switch
    {
        OtcProductTypeValue.Swap => new Swap(),
        OtcProductTypeValue.Cap => new Cap(),
        _ => throw new InvalidOperationException($"Unmapped OTC product type '{productType}'.")
    };

    deal.Raise(new DealCaptured(/* … */));
    return deal;
}
```

---

## Value object (data record)

```csharp
using Ets.Core.Domain.Models;

namespace Ets.Modules.Deals.Domain.ValueObjects;

public sealed record StrikePrice(Price Value) : IValueObject;
```

Validate in a static `Create` returning `Result<T>` when construction can fail on business rules.

---

## Enumeration value object (from a CML `enum`)

CML:

```cml
enum LoadProfile {
  BASE, PEAK, MORNING_PEAK, EVENING_PEAK
}
```

Paired `*Value` enum — this is what persistence and events store, by member name:

```csharp
namespace Ets.Core.Domain.ValueObjects;

public enum LoadProfileValue
{
    [UsedImplicitly] None = 0,
    [UsedImplicitly] Base = 1,
    [UsedImplicitly] Peak = 2,
    [UsedImplicitly] MorningPeak = 3,
    [UsedImplicitly] EveningPeak = 4
}
```

Enumeration record — rich properties belong here:

```csharp
using System.Diagnostics.CodeAnalysis;

namespace Ets.Core.Domain.ValueObjects;

public abstract record LoadProfile : Enumeration<LoadProfileValue, LoadProfile>
{
    [UsedImplicitly] public static readonly LoadProfile None = new UnspecifiedLoadProfile();
    [UsedImplicitly] public static readonly LoadProfile Base = new BaseLoadProfile();
    [UsedImplicitly] public static readonly LoadProfile Peak = new PeakLoadProfile();
    [UsedImplicitly] public static readonly LoadProfile MorningPeak = new MorningPeakLoadProfile();
    [UsedImplicitly] public static readonly LoadProfile EveningPeak = new EveningPeakLoadProfile();

    private LoadProfile(LoadProfileValue id, string name, bool excludesWeekendsAndHolidays) : base(id, name)
    {
        ExcludesWeekendsAndHolidays = excludesWeekendsAndHolidays;
    }

    public bool ExcludesWeekendsAndHolidays { get; }

    [UsedImplicitly]
    public static bool TryParse(string? value, [NotNullWhen(true)] out LoadProfile? profile)
    {
        profile = Enumerations.FirstOrDefault(x =>
            x.Value.Name.Equals(value, StringComparison.OrdinalIgnoreCase) ||
            Enum.GetName(x.Value.Value)?.Equals(value, StringComparison.OrdinalIgnoreCase) == true).Value;
        return profile != null;
    }

    private sealed record UnspecifiedLoadProfile() : LoadProfile(LoadProfileValue.None, string.Empty, false);

    private sealed record BaseLoadProfile() : LoadProfile(LoadProfileValue.Base, "Base load", false);

    private sealed record PeakLoadProfile() : LoadProfile(LoadProfileValue.Peak, "Peak load", true);

    private sealed record MorningPeakLoadProfile() : LoadProfile(LoadProfileValue.MorningPeak, "Morning peak", false);

    private sealed record EveningPeakLoadProfile() : LoadProfile(LoadProfileValue.EveningPeak, "Evening peak", false);
}
```

> An `aggregateLifecycle` enum drives the aggregate's state machine — enforce legal transitions in the
> root's behaviour methods and return `Result.Failure(DomainError.Conflict(...))` for illegal ones.

---

## Integration event (IntegrationEvents project)

Plain, versioned record with no kernel or Wolverine dependency:

```csharp
namespace Ets.Modules.Deals.IntegrationEvents.Events;

public sealed record DealConfirmedV1(
    Guid EventId,
    DateTimeOffset OccurredAt,
    Guid DealId,
    string DealReference,
    string Region);
```

Mapping from domain events lives in the producer's Infrastructure (`Messaging/DealsIntegrationEventMapper.cs`)
and runs inside the unit of work, before the outbox flush.

---

## Command + handler + validator (Application)

```csharp
using Ets.Core.Domain.CQRS;

namespace Ets.Modules.Deals.Application.Deals.ConfirmDeal;

public sealed record ConfirmDealCommand(Guid DealId, Guid ConfirmedBy) : ICommand;
```

Handlers and validators are `internal sealed` (architecture tests enforce it): callers inject
`ICommandHandler<T>` / `IQueryHandler<,>`, which the host decorates, never a concrete handler.

The handler is always: load by root id, bail if missing, call **one** aggregate method, propagate its
failure untouched, save through the unit of work (which also publishes mapped integration events via the
outbox):

```csharp
using Ets.Core.Domain.CQRS;
using Ets.Core.Domain.Models;
using Ets.Modules.Deals.Domain.Repositories;

namespace Ets.Modules.Deals.Application.Deals.ConfirmDeal;

[UsedImplicitly]
internal sealed class ConfirmDealCommandHandler(
    IDealRepository deals,
    IDealsUnitOfWork unitOfWork,
    IDateTimeProvider clock) : ICommandHandler<ConfirmDealCommand>
{
    public async Task<Result> HandleAsync(ConfirmDealCommand command, CancellationToken cancellationToken)
    {
        var deal = await deals.GetAsync(new DealId(command.DealId), cancellationToken).ConfigureAwait(false);

        if (deal is null)
        {
            return Result.Failure(DomainError.NotFound("deal.not-found", $"Deal '{command.DealId}' does not exist."));
        }

        var confirmResult = deal.Confirm(command.ConfirmedBy, clock);

        if (confirmResult.IsFailure)
        {
            return confirmResult;
        }

        return await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }
}
```

Validator — shape only; business rules stay in the aggregate:

```csharp
using FluentValidation;

namespace Ets.Modules.Deals.Application.Deals.ConfirmDeal;

[UsedImplicitly]
internal sealed class ConfirmDealCommandValidator : AbstractValidator<ConfirmDealCommand>
{
    public ConfirmDealCommandValidator()
    {
        RuleFor(command => command.DealId).NotEmpty().WithMessage("A deal id is required.");
        RuleFor(command => command.ConfirmedBy).NotEmpty().WithMessage("The confirming user is required.");
    }
}
```

---

## Consuming another module's integration event (Infrastructure, Wolverine)

An inbound adapter: translate and invoke this module's own command. Registered explicitly — Wolverine's
conventional discovery is off.

```csharp
using Ets.Core.Domain.CQRS;
using Ets.Modules.Deals.IntegrationEvents.Events;
using Ets.Modules.Settlement.Application.Schedules.ScheduleSettlement;

namespace Ets.Modules.Settlement.Infrastructure.Messaging;

[UsedImplicitly]
public sealed class DealConfirmedV1Consumer
{
    public static async Task HandleAsync(
        DealConfirmedV1 message,
        ICommandHandler<ScheduleSettlementCommand> handler,
        CancellationToken cancellationToken)
    {
        var result = await handler
            .HandleAsync(new ScheduleSettlementCommand(message.DealId, message.OccurredAt), cancellationToken)
            .ConfigureAwait(false);

        // A business failure is final; the host maps this exception to "move to error queue, no retry"
        // (opts.OnException<BusinessRuleViolationException>().MoveToErrorQueue()). Any other exception is
        // treated as transient and retried by Wolverine's error policy.
        if (result.IsFailure)
        {
            throw new BusinessRuleViolationException(result.Error!);
        }
    }
}
```

---

## Endpoint (Presentation, one per slice)

```csharp
using Ets.Core.Domain.CQRS;
using Ets.Core.Presentation.Endpoints;
using Ets.Core.Presentation.Results;
using Ets.Modules.Deals.Application.Deals.ConfirmDeal;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Ets.Modules.Deals.Presentation.Deals;

// POST /api/deals/{dealId}/confirm — prefix, tags and OpenAPI document come from DealsEndpoints.MapDealsModule.
internal sealed class ConfirmDeal : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("{dealId:guid}/confirm", static async (
                Guid dealId,
                ICurrentUser user,
                ICommandHandler<ConfirmDealCommand> handler,
                CancellationToken cancellationToken) =>
            {
                var result = await handler
                    .HandleAsync(new ConfirmDealCommand(dealId, user.UserId), cancellationToken)
                    .ConfigureAwait(false);

                return result.Match(Results.NoContent, ApiResults.Problem);
            })
            .RequirePolicy(app.Policies().Confirm)          // "deals:confirm"
            .WithTags(Tags.Deals)
            .WithName(nameof(ConfirmDeal))
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict);
    }
}
```

---

## Unit test (event-sourced: given events → when → then)

```csharp
namespace EtsDealsTests;

public sealed class DealLifecycleTests
{
    [Fact]
    public void Confirm_Fails_WhenDealIsCancelled()
    {
        var deal = DealFixture.Given(new DealCaptured(/* … */), new DealCancelled(/* … */));

        var result = deal.Confirm(Guid.CreateVersion7(), new FrozenDateTimeProvider());

        result.IsFailure.ShouldBeTrue();
        result.Error!.Code.ShouldBe("deal.status.illegal-transition");
        deal.UncommittedEvents.ShouldBeEmpty();
    }
}
```
