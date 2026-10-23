namespace Ets.Core.Domain.Specifications;

/// <summary>
///     Luhn mod N over the Base30 alphabet: the check character for a business reference.
/// </summary>
/// <remarks>
///     Working in the reference's own alphabet (rather than reducing characters to decimal digits) means
///     every single-character mistake and every adjacent transposition is detected, and the check character
///     reads like the rest of the reference.
/// </remarks>
internal static class LuhnModN
{
    private static string Alphabet => Constants.Base30.Base30Chars;

    public static char CalculateCheckCharacter(ReadOnlySpan<char> value)
    {
        int n = Alphabet.Length;
        int factor = 2;
        int sum = 0;

        for (int i = value.Length - 1; i >= 0; i--)
        {
            int codePoint = CodePointOf(value[i]);
            int addend = factor * codePoint;
            factor = factor == 2 ? 1 : 2;
            addend = addend / n + addend % n;
            sum += addend;
        }

        int remainder = sum % n;
        return Alphabet[(n - remainder) % n];
    }

    public static bool IsValid(ReadOnlySpan<char> valueWithCheckCharacter)
    {
        if (valueWithCheckCharacter.Length < 2)
        {
            return false;
        }

        foreach (char c in valueWithCheckCharacter)
        {
            if (Alphabet.IndexOf(char.ToUpperInvariant(c)) < 0)
            {
                return false;
            }
        }

        char expected = CalculateCheckCharacter(valueWithCheckCharacter[..^1]);
        return char.ToUpperInvariant(valueWithCheckCharacter[^1]) == expected;
    }

    private static int CodePointOf(char c)
    {
        int index = Alphabet.IndexOf(char.ToUpperInvariant(c));

        return index < 0
            ? throw new ArgumentException($"'{c}' is not a Base30 character.", nameof(c))
            : index;
    }
}
