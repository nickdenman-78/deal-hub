using Ets.Core.Domain.Models;
using Ets.Core.Domain.Services;
using Ets.Modules.Deals.Domain.Events;
using Ets.Modules.Deals.Domain.ValueObjects;

namespace Ets.Modules.Deals.Domain.Models;

/// <summary>
///     A retail deal: the aggregate root of <c>Aggregate RetailDeal</c> in <c>DealCaptureContext</c>. Event
///     sourced (ADR-0013); its state is rebuilt from its stream by the <c>Apply</c> methods.
/// </summary>
public sealed class RetailDeal : EventSourcedAggregate<DealId>
{
    /// <summary>For rehydration from the event stream only.</summary>
    [UsedImplicitly]
    private RetailDeal()
    {
    }

    /// <summary>Captures a new retail deal with a domain-generated id.</summary>
    [UsedImplicitly]
    public static RetailDeal Capture(IIdGenerator ids, IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(ids);
        ArgumentNullException.ThrowIfNull(clock);

        var deal = new RetailDeal();
        deal.Raise(new RetailDealCaptured(new DealId(ids.NewId()), clock.Now));
        return deal;
    }

    [UsedImplicitly]
    private void Apply(RetailDealCaptured @event)
    {
        Id = @event.DealId;
    }
}
