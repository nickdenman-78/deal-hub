using Ets.Core.Domain.CQRS;

namespace Ets.Modules.Deals.Application.Deals.GetAsxFuturesDeal;

/// <summary>One ASX futures deal.</summary>
/// <param name="DealId">The deal's id.</param>
public sealed record GetAsxFuturesDealQuery(Guid DealId) : IQuery<AsxFuturesDealResponse>;
