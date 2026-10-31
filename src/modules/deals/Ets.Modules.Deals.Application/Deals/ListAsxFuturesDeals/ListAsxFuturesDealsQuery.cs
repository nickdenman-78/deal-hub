using Ets.Core.Domain.CQRS;

namespace Ets.Modules.Deals.Application.Deals.ListAsxFuturesDeals;

/// <summary>Every ASX futures deal, most recently captured first.</summary>
public sealed record ListAsxFuturesDealsQuery : IQuery<IReadOnlyList<AsxFuturesDealResponse>>;
