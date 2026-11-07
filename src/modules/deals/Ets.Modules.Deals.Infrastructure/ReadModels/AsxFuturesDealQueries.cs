using Ets.Core.Domain.ValueObjects;
using Ets.Modules.Deals.Application.Deals;
using Ets.Modules.Deals.Domain.ValueObjects;
using Ets.Modules.Deals.Infrastructure.Persistence;
using Ets.Modules.Deals.Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace Ets.Modules.Deals.Infrastructure.ReadModels;

/// <summary>
///     The deal list and deal details, read from the <c>deals.asx_futures_deals</c> read model. It trails the
///     event store by the async daemon's lag, typically well under a second.
/// </summary>
[UsedImplicitly]
internal sealed class AsxFuturesDealQueries(DealsDbContext db) : IAsxFuturesDealQueries
{
    public async Task<IReadOnlyList<AsxFuturesDealResponse>> ListAsync(CancellationToken cancellationToken)
    {
        var rows = await db.AsxFuturesDeals
            .AsNoTracking()
            .OrderByDescending(deal => deal.CapturedAt)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return [.. rows.Select(ToResponse)];
    }

    public async Task<AsxFuturesDealResponse?> FindAsync(Guid dealId, CancellationToken cancellationToken)
    {
        var row = await db.AsxFuturesDeals
            .AsNoTracking()
            .SingleOrDefaultAsync(deal => deal.Id == dealId, cancellationToken)
            .ConfigureAwait(false);

        return row is null ? null : ToResponse(row);
    }

    internal static AsxFuturesDealResponse ToResponse(DbAsxFuturesDeal row)
    {
        // The code decodes the same way it did at capture; the size is the one recorded then.
        var product = new AsxProduct(
            ProductCode.Create(row.ProductCode).Value,
            ContractSize.Create(row.ContractDays, Volume.Create(row.ContractSize, VolumeUnit.MWh)).Value);

        return AsxFuturesDealResponse.From(row.Id, product, row.Direction, row.Price, row.Volume, row.CapturedAt);
    }
}
