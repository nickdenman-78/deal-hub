using System.Text.RegularExpressions;
using Ets.Core.Domain.Models;

namespace Ets.Core.Domain.ValueObjects;

/// <summary>
///     An Australian contact phone number, normalised to its national digits (<c>+61 7 3000 1234</c> becomes
///     <c>0730001234</c>).
/// </summary>
/// <remarks>
///     Valid numbers are 10-digit landline and mobile numbers (<c>02</c>, <c>03</c>, <c>04</c>, <c>07</c>,
///     <c>08</c>), <c>1300</c> and <c>1800</c> numbers, and 6-digit <c>13</c> numbers. Anything else is kept
///     with <see cref="IsValid" /> false.
/// </remarks>
public sealed partial record PhoneNumber : IValueObject
{
    private const string CountryCode = "61";

    private PhoneNumber(string value)
    {
        Value = value;
        IsValid = PhoneNumberRegex().IsMatch(value);
    }

    [UsedImplicitly] public string Value { get; }

    [UsedImplicitly] public bool IsValid { get; }

    [UsedImplicitly]
    public static PhoneNumber Create(string? value)
    {
        return new PhoneNumber(Normalise(value));
    }

    public override string ToString()
    {
        return Value;
    }

    private static string Normalise(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        string trimmed = value.Trim();
        string digits = SeparatorRegex().Replace(trimmed, string.Empty);

        bool international = digits.StartsWith('+') || digits.StartsWith("00" + CountryCode, StringComparison.Ordinal);
        digits = digits.TrimStart('+');

        if (digits.StartsWith("00" + CountryCode, StringComparison.Ordinal))
        {
            digits = digits[2..];
        }

        // +61 7 3000 1234 and 61 7 3000 1234 drop the country code for the trunk prefix 0.
        if ((international || digits.Length == 11) && digits.StartsWith(CountryCode, StringComparison.Ordinal))
        {
            digits = "0" + digits[CountryCode.Length..];
        }

        return digits;
    }

    [GeneratedRegex(@"^(0[23478]\d{8}|1[38]00\d{6}|13\d{4})$", RegexOptions.CultureInvariant)]
    private static partial Regex PhoneNumberRegex();

    [GeneratedRegex(@"[\s\-().]", RegexOptions.CultureInvariant)]
    private static partial Regex SeparatorRegex();
}
