using Ets.Core.Domain.Models;
using Ets.Core.Domain.ValueObjects;
using Ets.Modules.Deals.Domain.Services;
using Ets.Modules.Deals.Domain.ValueObjects;
using Ets.Modules.Deals.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Ets.Modules.Deals.Infrastructure.Products;

/// <summary>
///     The ASX product catalogue over the <c>deals.asx_products</c> table, loaded from ASX's contract size
///     schedule.
/// </summary>
[UsedImplicitly]
internal sealed class AsxProductCatalogue(DealsDbContext db) : IAsxProductCatalogue
{
    public const string NotListedErrorCode = "deal.asx-product.not-listed";

    public async Task<Result<AsxProduct>> FindListedProductAsync(
        ProductCode productCode,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(productCode);

        var listed = await db.AsxProducts
            .AsNoTracking()
            .Where(product => product.ProductCode == productCode.Value)
            .Select(product => new {product.NumberOfDays, product.ContractSize})
            .FirstOrDefaultAsync(cancellationToken)
            .ConfigureAwait(false);

        if (listed is null)
        {
            return Result.Failure<AsxProduct>(DomainError.NotFound(
                NotListedErrorCode,
                $"ASX does not list {productCode}."));
        }

        var contractSize = ContractSize.Create(listed.NumberOfDays, Volume.Create(listed.ContractSize, VolumeUnit.MWh));

        return contractSize.IsFailure
            ? Result.Failure<AsxProduct>(contractSize.Error!)
            : new AsxProduct(productCode, contractSize.Value);
    }
}
