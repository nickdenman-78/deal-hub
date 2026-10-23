using System.Globalization;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;

namespace Ets.Core.Domain.ValueObjects;

public partial record Number
{
    protected Number(decimal? value, int decimals = 4)
    {
        Decimals = decimals;
        RawValue = value;
        Value = value.HasValue ? Math.Round(value.Value, decimals, MidpointRounding.AwayFromZero) : null;
    }

    [JsonPropertyOrder(10)]
    [UsedImplicitly]
    public decimal? Value { get; private init; }

    [JsonPropertyOrder(20)]
    [UsedImplicitly]
    public decimal? RawValue { get; private init; }

    [JsonPropertyOrder(30)]
    [UsedImplicitly]
    public string ValueString => ToString();

    [JsonPropertyOrder(40)]
    [UsedImplicitly]
    public int Decimals { get; private init; }

    public override string ToString()
    {
        return !Value.HasValue ? string.Empty : Value.Value.ToString($"#,##0.{new string('0', Decimals)}", CultureInfo.InvariantCulture);
    }

    [UsedImplicitly]
    public static Number Create(decimal? value)
    {
        return new Number(value);
    }

    [UsedImplicitly]
    public static Number Create(decimal? value, int decimals)
    {
        return decimals switch
        {
            < 0 => throw new ArgumentOutOfRangeException(nameof(decimals), "Decimals must be greater than or equal to zero."),
            > 6 => throw new ArgumentOutOfRangeException(nameof(decimals), "Decimals must be less than or equal to 6."),
            _ => new Number(value, decimals)
        };
    }

    [UsedImplicitly]
    public static Number Create(int? value)
    {
        decimal? decValue = value.HasValue ? Convert.ToDecimal(value, CultureInfo.InvariantCulture) : null;
        return Create(decValue);
    }

    [UsedImplicitly]
    public static Number Create(int? value, int decimals)
    {
        decimal? decValue = value.HasValue ? Convert.ToDecimal(value, CultureInfo.InvariantCulture) : null;
        return Create(decValue, decimals);
    }


    [UsedImplicitly]
    public static Number Create(double? value)
    {
        decimal? decValue = value.HasValue ? Convert.ToDecimal(value, CultureInfo.InvariantCulture) : null;
        return Create(decValue);
    }

    [UsedImplicitly]
    public static Number Create(double? value, int decimals)
    {
        decimal? decValue = value.HasValue ? Convert.ToDecimal(value, CultureInfo.InvariantCulture) : null;
        return Create(decValue, decimals);
    }

    [UsedImplicitly]
    public static Number Create(long? value)
    {
        decimal? decValue = value.HasValue ? Convert.ToDecimal(value, CultureInfo.InvariantCulture) : null;
        return Create(decValue);
    }

    [UsedImplicitly]
    public static Number Create(long? value, int decimals)
    {
        decimal? decValue = value.HasValue ? Convert.ToDecimal(value, CultureInfo.InvariantCulture) : null;
        return Create(decValue, decimals);
    }

    [UsedImplicitly]
    public static Number Create(float? value)
    {
        decimal? decValue = value.HasValue ? Convert.ToDecimal(value, CultureInfo.InvariantCulture) : null;
        return Create(decValue);
    }

    [UsedImplicitly]
    public static Number Create(float? value, int decimals)
    {
        decimal? decValue = value.HasValue ? Convert.ToDecimal(value, CultureInfo.InvariantCulture) : null;
        return Create(decValue, decimals);
    }

    [UsedImplicitly]
    public static bool TryParse(string? value, out Number? number)
    {
        number = null;

        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        value = value.Trim();

        var regex = NumberInputRegex();
        var match = regex.Match(value);

        if (!match.Success)
        {
            return false;
        }

        string numericPart = match.Groups["value"].Value;

        if (!decimal.TryParse(numericPart, NumberStyles.Number, CultureInfo.InvariantCulture, out decimal numericValue))
        {
            return false;
        }

        number = new Number(numericValue);
        return true;
    }

    [GeneratedRegex(@"(?<value>[+-]?(?:\d+(?:,\d+)*(?:\.\d+)?|\.\d+))", RegexOptions.Compiled)]
    private static partial Regex NumberInputRegex();
}
