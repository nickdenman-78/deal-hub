using Ets.Core.Domain.CQRS;
using Ets.Core.Domain.Models;

namespace Ets.Modules.Deals.Application.Deals.GetAsxFuturesDeal;

/// <summary>Reads one deal from the read side; an unknown id is not found.</summary>
[UsedImplicitly]
internal sealed class GetAsxFuturesDealQueryHandler(IAsxFuturesDealQueries deals)
    : IQueryHandler<GetAsxFuturesDealQuery, AsxFuturesDealResponse>
{
    public async Task<Result<AsxFuturesDealResponse>> HandleAsync(
        GetAsxFuturesDealQuery query,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(query);

        var deal = await deals.FindAsync(query.DealId, cancellationToken).ConfigureAwait(false);

        return deal is null
            ? Result.Failure<AsxFuturesDealResponse>(DealErrors.NotFound(query.DealId))
            : deal;
    }
}
