using System.Text.Json;
using System.Text.Json.Serialization;
using Number = Ets.Core.Domain.ValueObjects.Number;

namespace EtsCoreTests;

public class NumberTests(ITestOutputHelper output)
{
    private static readonly JsonSerializerOptions JsonSettings = new()
    {
        WriteIndented = true,
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        Converters = {new JsonStringEnumConverter()}
    };

    public static TheoryData<string?, decimal?, bool> ParseNumberData =>
        new()
        {
            {"21 c/kw", 21M, true},
            {"31.2", 31.2M, true},
            {"10", 10M, true},
            {"1,000", 1_000M, true},
            {"1.23456789", 1.2346M, true},
            {"1.23456789", 1.2346M, true},
            {"$ 1.23456789 / MW", 1.2346M, true},
            {"1.23456789", 1.2346M, true},
            {"-1.23456789", -1.2346M, true},
            {".5", 0.5M, true},
            {"Non-numeric value", null, false},
            {"1.897254.123456789", 1.8973M, true}, // will pick the first valid number (including decimals)
            {"There are 2 numbers in this 1 text", 2M, true}, // will pick the first valid number (including decimals)
            {null, null, false},
            {"", null, false}
        };

    [Theory]
    [MemberData(nameof(ParseNumberData))]
    public void Verify_TryParseAmount(string? input, decimal? expectedNumber, bool expectedResult)
    {
        bool result = Number.TryParse(input, out var number);
        string json = JsonSerializer.Serialize(new {input, result, number}, JsonSettings);
        output.WriteLine(json);

        Assert.Equal(expectedResult, result);

        if (!expectedNumber.HasValue)
        {
            return;
        }

        output.WriteLine($"Testing: {input} -Expected Number: {expectedNumber} -Actual Number: {number?.Value}");
        Assert.True(result);
        Assert.Equal(expectedNumber, number?.Value);
    }
}
