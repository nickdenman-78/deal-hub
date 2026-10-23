using Ets.Core.Domain.Models;
using Ets.Core.Domain.Services;
using Ets.Core.Domain.ValueObjects;
using Ets.Modules.Deals.Domain.Events;
using Ets.Modules.Deals.Domain.ValueObjects;

namespace Ets.Modules.Deals.Domain.Models;

/// <summary>
///     An ASX electricity futures deal: a cash-settled contract for difference against the spot price of one
///     NEM region over the product's term.
/// </summary>
/// <remarks>
///     Invariants:
///     <list type="bullet">
///         <item>the product code decodes to a listed ASX product (the <see cref="AsxProduct" /> it is given);</item>
///         <item>volume is a whole number of lots, greater than zero, in MW (1 lot = 1 MW);</item>
///         <item>
///             price is in $/MWh, to the minimum price movement of $0.01/MWh; a $300 cap price is not
///             negative.
///         </item>
///     </list>
/// </remarks>
public sealed class AsxFuturesDeal : ExchangeDeal
{
    public const string DirectionRequiredErrorCode = "deal.asx-futures.direction.required";
    public const string NegativeCapPriceErrorCode = "deal.asx-futures.price.negative-cap";
    public const string PriceInvalidErrorCode = "deal.asx-futures.price.invalid";
    public const string PriceTickErrorCode = "deal.asx-futures.price.tick";
    public const string VolumeInvalidErrorCode = "deal.asx-futures.volume.invalid";
    public const string VolumeNotWholeLotsErrorCode = "deal.asx-futures.volume.whole-lots";

    /// <summary>The minimum price movement, in $/MWh.</summary>
    public const decimal PriceTick = 0.01m;

    // Rehydration only: a deal is created by Capture or rebuilt from its stream.
    private AsxFuturesDeal()
    {
    }

    [UsedImplicitly] public AsxProduct Product { get; private set; } = null!;

    /// <summary>The traded price, in $/MWh.</summary>
    [UsedImplicitly] public Amount Price { get; private set; } = null!;

    /// <summary>The number of lots, in MW.</summary>
    [UsedImplicitly] public Volume Volume { get; private set; } = null!;

    /// <summary>Captures an ASX futures deal and raises <see cref="AsxFuturesDealCaptured" />.</summary>
    [UsedImplicitly]
    public static Result<AsxFuturesDeal> Capture(
        AsxProduct product,
        TradeDirection direction,
        Amount price,
        Volume volume,
        IIdGenerator ids,
        IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(product);
        ArgumentNullException.ThrowIfNull(direction);
        ArgumentNullException.ThrowIfNull(price);
        ArgumentNullException.ThrowIfNull(volume);
        ArgumentNullException.ThrowIfNull(ids);
        ArgumentNullException.ThrowIfNull(clock);

        var validation = Validate(product, direction, price, volume);

        if (validation.IsFailure)
        {
            return Result.Failure<AsxFuturesDeal>(validation.Error!);
        }

        var deal = new AsxFuturesDeal();
        deal.Raise(new AsxFuturesDealCaptured(
            new DealId(ids.NewId()),
            product,
            direction,
            price,
            volume,
            clock.Now));

        return deal;
    }

    /// <summary>Total MWh over the term: volume (lots) x contract size.</summary>
    [UsedImplicitly]
    public Volume ContractedEnergy()
    {
        return Volume.Create(Volume.Value * Product.ContractSize.Energy.Value, VolumeUnit.MWh);
    }

    private static Result Validate(AsxProduct product, TradeDirection direction, Amount price, Volume volume)
    {
        if (direction.Value == TradeDirectionValue.None)
        {
            return Result.Failure(DomainError.Validation(
                DirectionRequiredErrorCode,
                "An ASX futures deal is a buy or a sell."));
        }

        if (volume.Unit != VolumeUnit.MW || volume.RawValue is not > 0)
        {
            return Result.Failure(DomainError.Validation(
                VolumeInvalidErrorCode,
                $"An ASX futures deal's volume is a number of lots greater than zero, in MW, not '{volume}'."));
        }

        if (volume.RawValue % 1 != 0)
        {
            return Result.Failure(DomainError.Validation(
                VolumeNotWholeLotsErrorCode,
                $"An ASX futures deal's volume is a whole number of lots, not '{volume}'."));
        }

        if (price.Unit != AmountUnit.DollarPerMWh || price.RawValue is not { } priceValue)
        {
            return Result.Failure(DomainError.Validation(
                PriceInvalidErrorCode,
                $"An ASX futures deal's price is in $/MWh, not '{price}'."));
        }

        if (priceValue % PriceTick != 0)
        {
            return Result.Failure(DomainError.Validation(
                PriceTickErrorCode,
                $"An ASX futures price moves in steps of ${PriceTick}/MWh; '{price}' is between steps."));
        }

        if (product.ProductCode.CommodityCode.Payoff.Value == FuturesPayoffValue.Cap300 && priceValue < 0)
        {
            return Result.Failure(DomainError.Validation(
                NegativeCapPriceErrorCode,
                $"A $300 cap futures price is not negative, so '{price}' is not a price for {product}."));
        }

        return Result.Success();
    }

    [UsedImplicitly]
    private void Apply(AsxFuturesDealCaptured @event)
    {
        Id = @event.DealId;
        Direction = @event.Direction;
        Product = @event.Product;
        Price = @event.Price;
        Volume = @event.Volume;
    }
}
