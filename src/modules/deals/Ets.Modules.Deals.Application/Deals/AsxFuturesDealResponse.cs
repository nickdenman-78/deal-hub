using Ets.Modules.Deals.Domain.Events;
using Ets.Modules.Deals.Domain.ValueObjects;

namespace Ets.Modules.Deals.Application.Deals;

/// <summary>An ASX futures deal as the deal queries return it.</summary>
/// <param name="Id">The deal's id.</param>
/// <param name="Direction"><c>Buy</c> or <c>Sell</c>.</param>
/// <param name="Price">The traded price, in $/MWh.</param>
/// <param name="Volume">The number of lots, in MW.</param>
/// <param name="ContractedEnergy">Volume x contract size, in MWh.</param>
/// <param name="CapturedAt">When the deal was captured.</param>
/// <param name="Product">The ASX product as it stood when the deal was captured.</param>
public sealed record AsxFuturesDealResponse(
    Guid Id,
    string Direction,
    decimal Price,
    decimal Volume,
    decimal ContractedEnergy,
    DateTimeOffset CapturedAt,
    AsxProductResponse Product)
{
    /// <summary>The deal as its capture recorded it, which is the whole deal until it can be amended.</summary>
    public static AsxFuturesDealResponse From(AsxFuturesDealCaptured captured)
    {
        ArgumentNullException.ThrowIfNull(captured);

        return From(
            captured.DealId.Value,
            captured.Product,
            captured.Direction.Name,
            captured.Price.Value ?? 0m,
            captured.Volume.Value ?? 0m,
            captured.OccurredAt);
    }

    /// <summary>A deal from a read model; contracted energy is the volume times the product's contract size.</summary>
    public static AsxFuturesDealResponse From(
        Guid id,
        AsxProduct product,
        string direction,
        decimal price,
        decimal volume,
        DateTimeOffset capturedAt)
    {
        ArgumentNullException.ThrowIfNull(product);

        decimal lotSize = product.ContractSize.Energy.Value ?? 0m;

        return new AsxFuturesDealResponse(
            id,
            direction,
            price,
            volume,
            volume * lotSize,
            capturedAt,
            AsxProductResponse.From(product));
    }
}
