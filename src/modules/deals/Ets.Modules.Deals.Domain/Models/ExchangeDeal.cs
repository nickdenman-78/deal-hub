using Ets.Core.Domain.Models;
using Ets.Modules.Deals.Domain.ValueObjects;

namespace Ets.Modules.Deals.Domain.Models;

/// <summary>
///     A deal traded on an exchange (ASX 24) and cleared by ASX Clear (Futures). The root of the
///     <c>ExchangeDeal</c> aggregate; each exchange product is a subtype.
/// </summary>
public abstract class ExchangeDeal : EventSourcedAggregate<DealId>
{
    [UsedImplicitly] public TradeDirection Direction { get; protected set; } = TradeDirection.None;
}
