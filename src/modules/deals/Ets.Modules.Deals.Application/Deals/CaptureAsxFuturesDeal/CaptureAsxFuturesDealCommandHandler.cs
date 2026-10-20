using Ets.Core.Domain.CQRS;
using Ets.Core.Domain.Models;
using Ets.Core.Domain.Services;
using Ets.Modules.Deals.Domain.Models;
using Ets.Modules.Deals.Domain.Repositories;
using Ets.Modules.Deals.Domain.Services;
using Ets.Modules.Deals.Domain.ValueObjects;

namespace Ets.Modules.Deals.Application.Deals.CaptureAsxFuturesDeal;

/// <summary>
///     Decodes the product code, looks the product up in the ASX catalogue, captures the deal and saves it.
///     Every failure is the domain's, returned untouched.
/// </summary>
[UsedImplicitly]
internal sealed class CaptureAsxFuturesDealCommandHandler(
    IAsxProductCatalogue catalogue,
    IExchangeDealRepository deals,
    IDealsUnitOfWork unitOfWork,
    IIdGenerator ids,
    IDateTimeProvider clock) : ICommandHandler<CaptureAsxFuturesDealCommand, Guid>
{
    public async Task<Result<Guid>> HandleAsync(
        CaptureAsxFuturesDealCommand command,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);

        var productCode = ProductCode.Create(command.ProductCode);

        if (productCode.IsFailure)
        {
            return Result.Failure<Guid>(productCode.Error!);
        }

        var product = await catalogue
            .FindListedProductAsync(productCode.Value, cancellationToken)
            .ConfigureAwait(false);

        if (product.IsFailure)
        {
            return Result.Failure<Guid>(product.Error!);
        }

        var deal = AsxFuturesDeal.Capture(product.Value, command.Direction, command.Price, command.Volume, ids, clock);

        if (deal.IsFailure)
        {
            return Result.Failure<Guid>(deal.Error!);
        }

        deals.Add(deal.Value);

        var saved = await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return saved.IsFailure
            ? Result.Failure<Guid>(saved.Error!)
            : deal.Value.Id.Value;
    }
}
