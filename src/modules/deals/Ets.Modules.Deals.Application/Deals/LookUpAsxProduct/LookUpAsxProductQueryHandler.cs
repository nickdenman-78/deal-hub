using Ets.Core.Domain.CQRS;
using Ets.Core.Domain.Models;
using Ets.Modules.Deals.Domain.Services;
using Ets.Modules.Deals.Domain.ValueObjects;

namespace Ets.Modules.Deals.Application.Deals.LookUpAsxProduct;

/// <summary>
///     A code that does not decode fails. A code that decodes but is not in the catalogue succeeds, unlisted
///     and without a contract size: the decode is still what the trader needs to see.
/// </summary>
[UsedImplicitly]
internal sealed class LookUpAsxProductQueryHandler(IAsxProductCatalogue catalogue)
    : IQueryHandler<LookUpAsxProductQuery, AsxProductResponse>
{
    public async Task<Result<AsxProductResponse>> HandleAsync(
        LookUpAsxProductQuery query,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(query);

        var code = ProductCode.Create(query.ProductCode);

        if (code.IsFailure)
        {
            return Result.Failure<AsxProductResponse>(code.Error!);
        }

        var listed = await catalogue.FindListedProductAsync(code.Value, cancellationToken).ConfigureAwait(false);

        if (listed.IsSuccess)
        {
            return AsxProductResponse.From(listed.Value);
        }

        return listed.Error!.Type == DomainErrorType.NotFound
            ? AsxProductResponse.From(code.Value)
            : Result.Failure<AsxProductResponse>(listed.Error);
    }
}
