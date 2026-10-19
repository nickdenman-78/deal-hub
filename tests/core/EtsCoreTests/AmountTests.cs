using System.Text.Json;
using System.Text.Json.Serialization;
using Ets.Core.Domain.ValueObjects;
using Amount = Ets.Core.Domain.ValueObjects.Amount;

namespace EtsCoreTests;

public class AmountTests(ITestOutputHelper output)
{
    private static readonly JsonSerializerOptions JsonSettings = new()
    {
        WriteIndented = true,
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        Converters = {new JsonStringEnumConverter()}
    };

    public static TheoryData<string?, decimal?, int?, bool> ParseAmountData =>
        new()
        {
            {"21 c/kw", 21M, (int?)AmountUnitValue.CentsPerKW, true},
            {"31.2c/kwh", 31.2M, (int?)AmountUnitValue.CentsPerKWh, true},
            {"10 $/MW", 10M, (int?)AmountUnitValue.DollarPerMW, true},
            {"1,000$/MWH", 1_000M, (int?)AmountUnitValue.DollarPerMWh, true},
            {"1.23456789$/MW", 1.2346M, (int?)AmountUnitValue.DollarPerMW, true},
            {"$1.23456789/MW", 1.2346M, (int?)AmountUnitValue.DollarPerMW, true},
            {"$ 1.23456789 / MW", 1.2346M, (int?)AmountUnitValue.DollarPerMW, true},
            {"-1.23456789$/MW", -1.2346M, (int?)AmountUnitValue.DollarPerMW, true},
            {"-$.5/MW", -0.5M, (int?)AmountUnitValue.DollarPerMW, true},
            {"1.23456789", 1.2346M, (int?)AmountUnitValue.None, true},
            {null, null, null, false},
            {"", null, null, false}
        };

    [Theory]
    [MemberData(nameof(ParseAmountData))]
    public void Verify_TryParseAmount(string? input, decimal? expectedAmount, int? expectedUnit, bool expectedResult)
    {
        bool result = Amount.TryParse(input, out var amount);
        string json = JsonSerializer.Serialize(new {input, result, amount}, JsonSettings);

        Assert.Equal(expectedResult, result);
        output.WriteLine(json);

        if (!expectedAmount.HasValue)
        {
            return;
        }

        output.WriteLine($"Testing: {input} -Expected Amount: {expectedAmount} -Actual Amount: {amount?.Value}");
        Assert.True(result);
        Assert.Equal(expectedAmount, amount?.Value);
        if (expectedUnit.HasValue && amount is not null)
        {
            Assert.Equivalent(expectedUnit.Value, amount.Unit.Value);
        }
    }
}
