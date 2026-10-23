using System.Globalization;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;

namespace Ets.Core.Domain.ValueObjects;

public sealed partial record Amount : Number
{
    // ReSharper disable once RedundantArgumentDefaultValue
    private Amount(decimal? value, AmountUnit? unit) : base(value, 4)
    {
        Unit = unit ?? AmountUnit.None;
    }

    [JsonPropertyOrder(1000)]
    [UsedImplicitly]
    public AmountUnit Unit { get; private init; }

    public override string ToString()
    {
        if (!Value.HasValue)
        {
            return string.Empty;
        }

        // if the unit symbol has a dollar sign, we remove it from the unit symbol part and insert it at the start of the string
        if (!string.IsNullOrWhiteSpace(Unit.Symbol) && Unit.Symbol.Contains('$', StringComparison.InvariantCultureIgnoreCase))
        {
            return Value.Value.ToString("$#,##0.00##", CultureInfo.InvariantCulture) + Unit.Symbol.Replace("$", string.Empty, StringComparison.InvariantCultureIgnoreCase);
        }

        // if no unit, assume dollars
        if (Unit == AmountUnit.None)
        {
            return Value.Value.ToString("$#,##0.00##", CultureInfo.InvariantCulture);
        }

        return Value.Value.ToString("#,##0.00##", CultureInfo.InvariantCulture) + (Unit == AmountUnit.None ? string.Empty : " " + Unit.Symbol);
    }

    [UsedImplicitly]
    public static Amount Create(decimal? value, string unit)
    {
        ArgumentNullException.ThrowIfNull(unit);

        var translatedUnit = AmountUnit.FromName(unit) ?? throw new ArgumentException($"Unknown amount unit: {unit}");
        return new Amount(value, translatedUnit);
    }

    [UsedImplicitly]
    public static Amount Create(decimal? value, AmountUnitValue unitValue)
    {
        var translatedUnit = AmountUnit.FromValue(unitValue) ?? throw new ArgumentException($"Unknown amount unit value: {unitValue}");
        return new Amount(value, translatedUnit);
    }

    [UsedImplicitly]
    public static Amount Create(decimal? value, AmountUnit unit)
    {
        ArgumentNullException.ThrowIfNull(unit);

        return new Amount(value, unit);
    }

    [UsedImplicitly]
    public static bool TryParse(string? value, out Amount? amount)
    {
        amount = null;

        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        value = value.Trim();

        var regex = AmountInputRegex();
        var match = regex.Match(value);

        if (!match.Success)
        {
            return false;
        }

        string signPart = match.Groups["sign"].Value;
        string currencyPart = match.Groups["currency"].Value;
        string numericPart = match.Groups["value"].Value;
        string unitPart = match.Groups["unit"].Value.Replace(" ", string.Empty, StringComparison.InvariantCultureIgnoreCase);

        if (!string.IsNullOrWhiteSpace(currencyPart))
        {
            unitPart = currencyPart + unitPart;
        }

        string parsedNumericValue = signPart + numericPart;
        if (!decimal.TryParse(parsedNumericValue, NumberStyles.Number, CultureInfo.InvariantCulture, out decimal numericValue))
        {
            return false;
        }

        AmountUnit unit;
        if (string.IsNullOrEmpty(unitPart))
        {
            unit = AmountUnit.None;
        }
        else
        {
            var unitMatch = AmountUnit.FromSymbol(unitPart);

            if (unitMatch == null)
            {
                return false;
            }

            unit = unitMatch;
        }

        amount = new Amount(numericValue, unit);
        return true;
    }

    [GeneratedRegex(@"^(?<sign>[-+])?\s*(?<currency>\$)?\s*(?<value>(?:\d+(?:,\d+)*(?:\.\d+)?|\.\d+))\s*(?<unit>[\$\s\/a-zA-Z]*)$", RegexOptions.Compiled)]
    private static partial Regex AmountInputRegex();
}
