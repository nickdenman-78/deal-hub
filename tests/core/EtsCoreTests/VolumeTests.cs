using System.Text.Json;
using System.Text.Json.Serialization;
using Ets.Core.Domain.ValueObjects;
using Volume = Ets.Core.Domain.ValueObjects.Volume;

namespace EtsCoreTests;

public class VolumeTests(ITestOutputHelper output)
{
    private static readonly JsonSerializerOptions JsonSettings = new()
    {
        WriteIndented = true,
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        Converters = {new JsonStringEnumConverter()}
    };

    public static TheoryData<string?, decimal?, int?, bool> ParseVolumeData =>
        new()
        {
            {"1 KW", 1M, (int?)VolumeUnitValue.KW, true},
            {"1KW", 1M, (int?)VolumeUnitValue.KW, true},
            {"10 kW", 10M, (int?)VolumeUnitValue.KW, true},
            {"1,000 kW", 1_000M, (int?)VolumeUnitValue.KW, true},
            {"1,000 kWh", 1_000M, (int?)VolumeUnitValue.KWh, true},
            {"1,000 mwh", 1_000M, (int?)VolumeUnitValue.MWh, true},
            {"1,000.523 mwh", 1_000.523M, (int?)VolumeUnitValue.MWh, true},
            {"1.23456789MW", 1.2346M, (int?)VolumeUnitValue.MW, true},
            {"1.23456789 mwh", 1.2346M, (int?)VolumeUnitValue.MWh, true},
            {"-.5MW", -0.5M, (int?)VolumeUnitValue.MW, true},
            {"1.23456789", 1.2346M, (int?)VolumeUnitValue.None, true},
            {null, null, null, false},
            {"", null, null, false}
        };

    [Theory]
    [MemberData(nameof(ParseVolumeData))]
    public void Verify_TryParseVolume(string? input, decimal? expectedVolume, int? expectedUnit, bool expectedResult)
    {
        bool result = Volume.TryParse(input, out var volume);
        string json = JsonSerializer.Serialize(new {input, result, volume}, JsonSettings);

        Assert.Equal(expectedResult, result);
        output.WriteLine(json);

        if (!expectedVolume.HasValue)
        {
            return;
        }

        output.WriteLine($"Testing: {input} -Expected Volume: {expectedVolume} -Actual Volume: {volume?.Value}");
        Assert.True(result);
        Assert.Equal(expectedVolume, volume?.Value);
        if (expectedUnit.HasValue && volume is not null)
        {
            Assert.Equivalent(expectedUnit.Value, volume.Unit.Value);
        }
    }
}
