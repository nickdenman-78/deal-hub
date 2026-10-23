using System.Globalization;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;

namespace Ets.Core.Domain.ValueObjects;

public sealed partial record Volume : Number
{
    // ReSharper disable once RedundantArgumentDefaultValue
    private Volume(decimal? value, VolumeUnit? unit) : base(value, 4)
    {
        Unit = unit ?? VolumeUnit.None;
    }

    [JsonPropertyOrder(1000)]
    [UsedImplicitly]
    public VolumeUnit Unit { get; private init; }

    public override string ToString()
    {
        if (!Value.HasValue)
        {
            return string.Empty;
        }

        return Value.Value.ToString("#,##0.####", CultureInfo.InvariantCulture) + (Unit == VolumeUnit.None ? string.Empty : " " + Unit.Symbol);
    }

    [UsedImplicitly]
    public static Volume Create(decimal? value, string unit)
    {
        ArgumentNullException.ThrowIfNull(unit);

        var translatedUnit = VolumeUnit.FromName(unit) ?? throw new ArgumentException($"Unknown volume unit: {unit}");
        return new Volume(value, translatedUnit);
    }

    [UsedImplicitly]
    public static Volume Create(decimal? value, VolumeUnitValue unitValue)
    {
        var translatedUnit = VolumeUnit.FromValue(unitValue) ?? throw new ArgumentException($"Unknown volume unit value: {unitValue}");
        return new Volume(value, translatedUnit);
    }

    [UsedImplicitly]
    public static Volume Create(decimal? value, VolumeUnit unit)
    {
        ArgumentNullException.ThrowIfNull(unit);

        return new Volume(value, unit);
    }

    [UsedImplicitly]
    public static bool TryParse(string? value, out Volume? volume)
    {
        volume = null;

        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        value = value.Trim();

        var regex = VolumeInputRegex();
        var match = regex.Match(value);

        if (!match.Success)
        {
            return false;
        }

        string signPart = match.Groups["sign"].Value;
        string numericPart = match.Groups["value"].Value;
        string unitPart = match.Groups["unit"].Value;

        string parsedNumericValue = signPart + numericPart;
        if (!decimal.TryParse(parsedNumericValue, NumberStyles.Number, CultureInfo.InvariantCulture, out decimal numericValue))
        {
            return false;
        }

        VolumeUnit unit;
        if (string.IsNullOrEmpty(unitPart))
        {
            unit = VolumeUnit.None;
        }
        else
        {
            var unitMatch = VolumeUnit.FromName(unitPart);

            if (unitMatch == null)
            {
                return false;
            }

            unit = unitMatch;
        }

        volume = new Volume(numericValue, unit);
        return true;
    }

    [GeneratedRegex(@"^(?<sign>[-+])?\s*(?<value>(?:\d+(?:,\d+)*(?:\.\d+)?|\.\d+))\s*(?<unit>[a-zA-Z]*)$", RegexOptions.Compiled)]
    private static partial Regex VolumeInputRegex();
}
