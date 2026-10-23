using System.Diagnostics.CodeAnalysis;
using System.Globalization;
using Ets.Core.Domain.Models;

namespace Ets.Core.Domain.ValueObjects;

/// <summary>
///     An Australian Company Number: 9 digits, the last a mod 10 check digit over the first eight (ASIC
///     algorithm). Stored as its digits; <see cref="ToString" /> formats it as <c>004 085 616</c>.
/// </summary>
/// <remarks>An ACN that fails the check digit is kept with <see cref="IsValid" /> false.</remarks>
[SuppressMessage("Minor Code Smell", "S101:Types should be named in PascalCase")]
public sealed record ACN : IValueObject
{
    private const int Length = 9;

    private ACN(string value)
    {
        Value = value;
        IsValid = HasValidCheckDigit(value);
    }

    [UsedImplicitly] public string Value { get; }

    [UsedImplicitly] public bool IsValid { get; }

    [UsedImplicitly]
    public static ACN Create(string? value)
    {
        return new ACN(BusinessNumber.Digits(value));
    }

    public override string ToString()
    {
        return IsValid
            ? string.Create(CultureInfo.InvariantCulture, $"{Value[..3]} {Value[3..6]} {Value[6..]}")
            : Value;
    }

    private static bool HasValidCheckDigit(string digits)
    {
        if (digits.Length != Length || !digits.All(char.IsAsciiDigit))
        {
            return false;
        }

        // Weights 8 down to 1 over the first eight digits; the check digit is the tens complement of the sum.
        int sum = 0;
        for (int i = 0; i < Length - 1; i++)
        {
            sum += (digits[i] - '0') * (Length - 1 - i);
        }

        int checkDigit = (10 - sum % 10) % 10;
        return digits[Length - 1] - '0' == checkDigit;
    }
}
