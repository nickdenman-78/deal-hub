using Ets.Core.Domain.CQRS;
using Ets.Core.Domain.Models;

namespace Ets.Modules.Deals.Application.Deals.ListAsxFuturesDeals;

/// <summary>Reads the deal list from the read side.</summary>
[UsedImplicitly]
internal sealed class ListAsxFuturesDealsQueryHandler(IAsxFuturesDealQueries deals)
    : IQueryHandler<ListAsxFuturesDealsQuery, IReadOnlyList<AsxFuturesDealResponse>>
{
    public async Task<Result<IReadOnlyList<AsxFuturesDealResponse>>> HandleAsync(
        ListAsxFuturesDealsQuery query,
        CancellationToken cancellationToken)
    {
        var all = await deals.ListAsync(cancellationToken).ConfigureAwait(false);

        return Result.Success(all);
    }
}
