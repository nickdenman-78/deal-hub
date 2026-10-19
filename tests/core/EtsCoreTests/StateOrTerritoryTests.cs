using System.Text.Json;
using System.Text.Json.Serialization;
using Ets.Core.Domain.ValueObjects;

namespace EtsCoreTests;

public class StateOrTerritoryTests(ITestOutputHelper output)
{
    private static readonly JsonSerializerOptions JsonSettings = new()
    {
        WriteIndented = true,
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        Converters = {new JsonStringEnumConverter()}
    };

    [Fact]
    public void Verify_StateOrTerritory_Serialization()
    {
        string json = JsonSerializer.Serialize(StateOrTerritory.Items, JsonSettings);
        output.WriteLine(json);
        Assert.True(true);
    }

    [Fact]
    public void Verify_NEMRegion_Serialization()
    {
        string json = JsonSerializer.Serialize(NEMRegion.Items, JsonSettings);
        output.WriteLine(json);
        Assert.True(true);
    }

    [Theory]
    [InlineData("QLD", "QLD", true)]
    [InlineData("NSW", "NSW", true)]
    [InlineData("VIC", "VIC", true)]
    [InlineData("TAS", "TAS", true)]
    [InlineData("SA", "SA", true)]
    [InlineData("Queensland", "QLD", true)]
    [InlineData("New South Wales", "NSW", true)]
    [InlineData("Unknown", null, false)]
    [InlineData(null, null, false)]
    public void Verify_TryParseStateOrTerritory(string? input, string? name, bool expected)
    {
        bool result = StateOrTerritory.TryParse(input, out var stateOrTerritory);
        string json = JsonSerializer.Serialize(new {input, result, stateOrTerritory}, JsonSettings);
        output.WriteLine(json);

        if (expected)
        {
            Assert.Equal(name, stateOrTerritory?.Name);
        }
        else
        {
            Assert.Null(stateOrTerritory);
        }

        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData("QLD", "QLD", true)]
    [InlineData("NSW", "NSW", true)]
    [InlineData("VIC", "VIC", true)]
    [InlineData("TAS", "TAS", true)]
    [InlineData("SA", "SA", true)]
    [InlineData("QLD1", "QLD", true)]
    [InlineData("NSW1", "NSW", true)]
    [InlineData("Unknown", null, false)]
    [InlineData(null, null, false)]
    public void Verify_TryParseNEMRegion(string? input, string? name, bool expected)
    {
        bool result = NEMRegion.TryParse(input, out var region);
        string json = JsonSerializer.Serialize(new {input, result, region}, JsonSettings);
        output.WriteLine(json);

        if (expected)
        {
            Assert.Equal(name, region?.Name);
        }
        else
        {
            Assert.Null(region);
        }

        Assert.Equal(expected, result);
    }
}
