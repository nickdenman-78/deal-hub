using System.Diagnostics.CodeAnalysis;
using System.Globalization;
using Ets.Core.Domain.Models;

namespace Ets.Core.Domain.ValueObjects;

/// <summary>
///     An Australian Business Number: 11 digits whose weighted checksum (ABR algorithm) is divisible by 89.
///     Stored as its digits; <see cref="ToString" /> formats it as <c>51 824 753 556</c>.
/// </summary>
/// <remarks>An ABN that fails the checksum is kept with <see cref="IsValid" /> false.</remarks>
[SuppressMessage("Minor Code Smell", "S101:Types should be named in PascalCase")]
public sealed record ABN : IValueObject
{
    private const int Length = 11;
    private const int Modulus = 89;

    private static readonly int[] Weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];

    private ABN(string value)
    {
        Value = value;
        IsValid = HasValidChecksum(value);
    }

    [UsedImplicitly] public string Value { get; }

    [UsedImplicitly] public bool IsValid { get; }

    [UsedImplicitly]
    public static ABN Create(string? value)
    {
        return new ABN(BusinessNumber.Digits(value));
    }

    public override string ToString()
    {
        return IsValid
            ? string.Create(CultureInfo.InvariantCulture, $"{Value[..2]} {Value[2..5]} {Value[5..8]} {Value[8..]}")
            : Value;
    }

    private static bool HasValidChecksum(string digits)
    {
        if (digits.Length != Length || !digits.All(char.IsAsciiDigit))
        {
            return false;
        }

        // Subtract 1 from the first digit, weight each digit, and the sum must divide by 89.
        int sum = 0;
        for (int i = 0; i < Length; i++)
        {
            int digit = digits[i] - '0';
            if (i == 0)
            {
                digit--;
            }

            sum += digit * Weights[i];
        }

        return sum % Modulus == 0;
    }
}
