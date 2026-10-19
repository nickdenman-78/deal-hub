using Ets.Core.Domain.Models;
using Ets.Modules.Deals.Domain.ValueObjects;

namespace Ets.Modules.Deals.Domain.Services;

/// <summary>
///     Looks up listed ASX electricity futures products by product code. The contract size comes from ASX's
///     published schedule; the adapter lives in Infrastructure.
/// </summary>
public interface IAsxProductCatalogue
{
    /// <summary>
    ///     The listed product for <paramref name="productCode" />, or a <see cref="DomainErrorType.NotFound" />
    ///     failure when ASX does not list it.
    /// </summary>
    Task<Result<AsxProduct>> FindListedProductAsync(ProductCode productCode, CancellationToken cancellationToken);
}
