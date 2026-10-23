using Ets.Core.Application.Services;
using Ets.Core.Domain.Services;
using Ets.Core.Domain.ValueObjects;
using Ets.Modules.Deals.Domain.Events;
using Ets.Modules.Deals.Domain.Models;
using Ets.Modules.Deals.Domain.ValueObjects;

namespace EtsDealsTests.Models;

public sealed class AsxFuturesDealTests
{
    private static readonly Guid DealGuid = Guid.CreateVersion7();
    private static readonly DateTimeOffset CapturedAt = new(2026, 10, 19, 9, 30, 0, TimeSpan.FromHours(10));

    private readonly IDateTimeProvider _clock = new FrozenDateTimeProvider(CapturedAt);
    private readonly IIdGenerator _ids = new FixedIdGenerator(DealGuid);

    public static TheoryData<decimal, VolumeUnitValue> InvalidVolumes =>
        new()
        {
            {0m, VolumeUnitValue.MW},
            {-5m, VolumeUnitValue.MW},
            {5m, VolumeUnitValue.MWh},
            {5_000m, VolumeUnitValue.KW},
            {5m, VolumeUnitValue.None}
        };

    public static TheoryData<decimal> OffTickPrices => [95.505m, 95.501m, 0.001m];

    [Fact]
    public void Capture_Raises_AsxFuturesDealCaptured()
    {
        var product = Product("BNH26", 90, 2_160m);

        var result = AsxFuturesDeal.Capture(product, TradeDirection.Buy, Price(95.50m), Lots(5), _ids, _clock);

        result.IsSuccess.ShouldBeTrue();
        var captured = result.Value.UncommittedEvents.ShouldHaveSingleItem().ShouldBeOfType<AsxFuturesDealCaptured>();
        captured.DealId.ShouldBe(new DealId(DealGuid));
        captured.Product.ShouldBe(product);
        captured.Direction.ShouldBe(TradeDirection.Buy);
        captured.Price.ShouldBe(Price(95.50m));
        captured.Volume.ShouldBe(Lots(5));
        captured.OccurredAt.ShouldBe(CapturedAt);
    }

    [Fact]
    public void Capture_Sets_TheDealsState()
    {
        var product = Product("HNZ26", 365, 8_760m);

        var deal = AsxFuturesDeal.Capture(product, TradeDirection.Sell, Price(110m), Lots(3), _ids, _clock).Value;

        deal.Id.ShouldBe(new DealId(DealGuid));
        deal.Direction.ShouldBe(TradeDirection.Sell);
        deal.Product.ProductCode.Term.Name.ShouldBe("Cal27");
        deal.Price.Value.ShouldBe(110m);
        deal.Volume.Value.ShouldBe(3m);
        deal.Version.ShouldBe(0);
    }

    [Fact]
    public void ContractedEnergy_Is_LotsTimesContractSize()
    {
        var deal = AsxFuturesDeal
            .Capture(Product("BNH26", 90, 2_160m), TradeDirection.Buy, Price(95.50m), Lots(5), _ids, _clock)
            .Value;

        var energy = deal.ContractedEnergy();

        energy.Value.ShouldBe(10_800m);
        energy.Unit.ShouldBe(VolumeUnit.MWh);
    }

    [Fact]
    public void Capture_Fails_WithoutABuyOrSell()
    {
        var result = AsxFuturesDeal.Capture(
            Product("BNH26", 90, 2_160m), TradeDirection.None, Price(95.50m), Lots(5), _ids, _clock);

        result.IsFailure.ShouldBeTrue();
        result.Error!.Code.ShouldBe(AsxFuturesDeal.DirectionRequiredErrorCode);
    }

    [Theory]
    [MemberData(nameof(InvalidVolumes))]
    public void Capture_Fails_WithoutAPositiveVolumeInMW(decimal volume, VolumeUnitValue unit)
    {
        var result = AsxFuturesDeal.Capture(
            Product("BNH26", 90, 2_160m), TradeDirection.Buy, Price(95.50m), Volume.Create(volume, unit), _ids, _clock);

        result.IsFailure.ShouldBeTrue();
        result.Error!.Code.ShouldBe(AsxFuturesDeal.VolumeInvalidErrorCode);
    }

    [Fact]
    public void Capture_Fails_ForAPartLot()
    {
        var result = AsxFuturesDeal.Capture(
            Product("BNH26", 90, 2_160m), TradeDirection.Buy, Price(95.50m), Volume.Create(2.5m, VolumeUnit.MW), _ids, _clock);

        result.IsFailure.ShouldBeTrue();
        result.Error!.Code.ShouldBe(AsxFuturesDeal.VolumeNotWholeLotsErrorCode);
    }

    [Theory]
    [InlineData(AmountUnitValue.DollarPerMW)]
    [InlineData(AmountUnitValue.CentsPerKWh)]
    [InlineData(AmountUnitValue.None)]
    public void Capture_Fails_ForAPriceNotInDollarsPerMWh(AmountUnitValue unit)
    {
        var result = AsxFuturesDeal.Capture(
            Product("BNH26", 90, 2_160m), TradeDirection.Buy, Amount.Create(95.50m, unit), Lots(5), _ids, _clock);

        result.IsFailure.ShouldBeTrue();
        result.Error!.Code.ShouldBe(AsxFuturesDeal.PriceInvalidErrorCode);
    }

    [Theory]
    [MemberData(nameof(OffTickPrices))]
    public void Capture_Fails_ForAPriceBetweenTicks(decimal price)
    {
        var result = AsxFuturesDeal.Capture(
            Product("BNH26", 90, 2_160m), TradeDirection.Buy, Price(price), Lots(5), _ids, _clock);

        result.IsFailure.ShouldBeTrue();
        result.Error!.Code.ShouldBe(AsxFuturesDeal.PriceTickErrorCode);
    }

    [Fact]
    public void Capture_Fails_ForANegativeCapPrice()
    {
        var result = AsxFuturesDeal.Capture(
            Product("GNH26", 90, 2_160m), TradeDirection.Buy, Price(-0.01m), Lots(5), _ids, _clock);

        result.IsFailure.ShouldBeTrue();
        result.Error!.Code.ShouldBe(AsxFuturesDeal.NegativeCapPriceErrorCode);
    }

    [Fact]
    public void Capture_Accepts_ANegativeStandardPrice()
    {
        var result = AsxFuturesDeal.Capture(
            Product("BSH26", 90, 2_160m), TradeDirection.Buy, Price(-12.34m), Lots(5), _ids, _clock);

        result.IsSuccess.ShouldBeTrue();
    }

    [Fact]
    public void LoadFromHistory_Rebuilds_TheCapturedDeal()
    {
        var captured = AsxFuturesDeal
            .Capture(Product("PVM26", 65, 975m), TradeDirection.Buy, Price(140.25m), Lots(2), _ids, _clock)
            .Value;

        var rebuilt = (AsxFuturesDeal)Activator.CreateInstance(typeof(AsxFuturesDeal), nonPublic: true)!;
        rebuilt.LoadFromHistory(captured.UncommittedEvents);

        rebuilt.ShouldBe(captured);
        rebuilt.Product.ShouldBe(captured.Product);
        rebuilt.Direction.ShouldBe(TradeDirection.Buy);
        rebuilt.Price.ShouldBe(captured.Price);
        rebuilt.Volume.ShouldBe(captured.Volume);
        rebuilt.Version.ShouldBe(1);
        rebuilt.UncommittedEvents.ShouldBeEmpty();
    }

    private static AsxProduct Product(string code, int days, decimal megawattHoursPerLot)
    {
        return new AsxProduct(
            ProductCode.Create(code).Value,
            ContractSize.Create(days, Volume.Create(megawattHoursPerLot, VolumeUnit.MWh)).Value);
    }

    private static Amount Price(decimal dollarsPerMegawattHour)
    {
        return Amount.Create(dollarsPerMegawattHour, AmountUnit.DollarPerMWh);
    }

    private static Volume Lots(int lots)
    {
        return Volume.Create(lots, VolumeUnit.MW);
    }

    private sealed class FixedIdGenerator(Guid id) : IIdGenerator
    {
        public Guid NewId()
        {
            return id;
        }
    }
}
