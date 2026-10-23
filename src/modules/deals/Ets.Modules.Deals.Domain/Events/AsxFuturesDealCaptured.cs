using Ets.Core.Domain.Events;
using Ets.Core.Domain.ValueObjects;
using Ets.Modules.Deals.Domain.ValueObjects;

namespace Ets.Modules.Deals.Domain.Events;

/// <summary>An ASX futures deal was captured. The first event of every ASX futures deal stream.</summary>
public sealed record AsxFuturesDealCaptured(
    DealId DealId,
    AsxProduct Product,
    TradeDirection Direction,
    Amount Price,
    Volume Volume,
    DateTimeOffset OccurredAt) : IDomainEvent;
