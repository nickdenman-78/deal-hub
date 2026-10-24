using System.Text.Json;
using Ets.Core.Domain.ValueObjects;
using Ets.Modules.Deals.Domain.Events;
using Ets.Modules.Deals.Domain.ValueObjects;
using Ets.Modules.Deals.Infrastructure.EventStore.Serialization;

namespace EtsDealsTests.Infrastructure;

public sealed class DealsEventJsonTests
{
    private static readonly JsonSerializerOptions Options = CreateOptions();

    [Fact]
    public void AsxFuturesDealCaptured_RoundTrips()
    {
        var captured = new AsxFuturesDealCaptured(
            new DealId(Guid.CreateVersion7()),
            new AsxProduct(
                ProductCode.Create("BNH26").Value,
                ContractSize.Create(90, Volume.Create(2_160m, VolumeUnit.MWh)).Value),
            TradeDirection.Sell,
            Amount.Create(95.505m, AmountUnit.DollarPerMWh),
            Volume.Create(5, VolumeUnit.MW),
            new DateTimeOffset(2026, 10, 19, 9, 30, 0, TimeSpan.FromHours(10)));

        var read = JsonSerializer.Deserialize<AsxFuturesDealCaptured>(
            JsonSerializer.Serialize(captured, Options),
            Options)!;

        read.DealId.ShouldBe(captured.DealId);
        read.Product.ProductCode.ShouldBe(captured.Product.ProductCode);
        read.Product.ContractSize.NumberOfDays.ShouldBe(90);
        read.Product.ContractSize.Energy.ShouldBe(captured.Product.ContractSize.Energy);
        read.Direction.ShouldBe(TradeDirection.Sell);
        read.Price.ShouldBe(captured.Price);
        read.Volume.ShouldBe(captured.Volume);
        read.OccurredAt.ShouldBe(captured.OccurredAt);
    }

    [Fact]
    public void Enumeration_IsStored_AsItsMemberName()
    {
        JsonSerializer.Serialize(TradeDirection.Buy, Options).ShouldBe("\"Buy\"");
    }

    [Fact]
    public void Amount_IsStored_WithItsUnroundedValueAndUnit()
    {
        JsonSerializer.Serialize(Amount.Create(95.50005m, AmountUnit.DollarPerMWh), Options)
            .ShouldBe("""{"value":95.50005,"unit":"DollarPerMWh"}""");
    }

    [Fact]
    public void ProductCode_IsStored_AsItsCode()
    {
        JsonSerializer.Serialize(ProductCode.Create("bnh26").Value, Options).ShouldBe("\"BNH26\"");
    }

    [Theory]
    [InlineData("\"Hold\"", typeof(TradeDirection))]
    [InlineData("\"BNF26\"", typeof(ProductCode))]
    [InlineData("""{"value":5,"unit":"Furlongs"}""", typeof(Volume))]
    [InlineData("""{"numberOfDays":0,"energy":{"value":1,"unit":"MWh"}}""", typeof(ContractSize))]
    public void Read_Fails_ForAStoredFormItDoesNotRecognise(string json, Type type)
    {
        Should.Throw<JsonException>(() => JsonSerializer.Deserialize(json, type, Options));
    }

    private static JsonSerializerOptions CreateOptions()
    {
        var options = new JsonSerializerOptions();
        DealsEventJson.Configure(options);

        return options;
    }
}
