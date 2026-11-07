using Ets.Core.Domain.ValueObjects;
using Ets.Modules.Deals.Application.Deals;
using Ets.Modules.Deals.Domain.Events;
using Ets.Modules.Deals.Domain.ValueObjects;
using Ets.Modules.Deals.Infrastructure.ReadModels;

namespace EtsDealsTests.Infrastructure;

public sealed class AsxFuturesDealsReadModelTests
{
    [Fact]
    public void ToRow_FlattensTheCapturedDeal()
    {
        var captured = Captured();

        var row = AsxFuturesDealsReadModel.ToRow(captured, version: 1);

        row.Id.ShouldBe(captured.DealId.Value);
        row.Version.ShouldBe(1);
        row.ProductCode.ShouldBe("BQZ26");
        row.Region.ShouldBe("QLD");
        row.LoadProfile.ShouldBe("Base load");
        row.Payoff.ShouldBe("Standard");
        row.Period.ShouldBe("Quarter");
        row.TermStart.ShouldBe(new DateOnly(2026, 10, 1));
        row.TermEnd.ShouldBe(new DateOnly(2026, 12, 31));
        row.ContractDays.ShouldBe(92);
        row.ContractSize.ShouldBe(2_208m);
        row.Direction.ShouldBe("Sell");
        row.Price.ShouldBe(87.25m);
        row.Volume.ShouldBe(3m);
        row.ContractedEnergy.ShouldBe(6_624m);
        row.CapturedAt.ShouldBe(captured.OccurredAt);
    }

    [Fact]
    public void Row_ReadsBackAsTheSameDeal_AsTheEvent()
    {
        var captured = Captured();

        var response = AsxFuturesDealQueries.ToResponse(AsxFuturesDealsReadModel.ToRow(captured, version: 1));

        response.ShouldBe(AsxFuturesDealResponse.From(captured));
    }

    private static AsxFuturesDealCaptured Captured()
    {
        return new AsxFuturesDealCaptured(
            new DealId(Guid.CreateVersion7()),
            new AsxProduct(
                ProductCode.Create("BQZ26").Value,
                ContractSize.Create(92, Volume.Create(2_208m, VolumeUnit.MWh)).Value),
            TradeDirection.Sell,
            Amount.Create(87.25m, AmountUnit.DollarPerMWh),
            Volume.Create(3, VolumeUnit.MW),
            new DateTimeOffset(2026, 11, 1, 14, 30, 0, TimeSpan.FromHours(10)));
    }
}
