using Ets.Core.Domain.Events;
using Ets.Modules.Deals.Domain.ValueObjects;

namespace Ets.Modules.Deals.Domain.Events;

/// <summary>A retail deal was captured. The first event of every retail deal stream.</summary>
public sealed record RetailDealCaptured(DealId DealId, DateTimeOffset OccurredAt) : IDomainEvent;
