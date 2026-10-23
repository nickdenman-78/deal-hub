using System.Numerics;
using System.Security.Cryptography;

namespace Ets.Core.Domain.Specifications;

public static class Base30Encoding
{
    // Extension method for easy Int64 encoding
    public static string ToBase30(this long value)
    {
        return Encode(value);
    }

    // Extension method for easy string decoding
    public static long FromBase30(this string value)
    {
        return Decode(value);
    }

    // Try-pattern for safe decoding
    public static bool TryDecodeFromBase30(string encoded, out long result)
    {
        result = 0;
        try
        {
            result = Decode(encoded);
            return true;
        }
        catch (ArgumentException)
        {
            return false;
        }
        catch (OverflowException)
        {
            return false;
        }
    }

    // Batch encoding for better performance with multiple values
    public static string[] EncodeBatch(IEnumerable<long> values)
    {
        return values.Select(Encode).ToArray();
    }

    // Batch decoding with error handling
    public static (long[] Values, string[] Errors) DecodeBatch(IEnumerable<string> encoded)
    {
        ArgumentNullException.ThrowIfNull(encoded);

        var results = new List<long>();
        var errors = new List<string>();

        foreach (string value in encoded)
        {
            try
            {
                results.Add(Decode(value));
            }
            catch (ArgumentException ex)
            {
                errors.Add($"Error decoding '{value}': {ex.Message}");
            }
            catch (OverflowException ex)
            {
                errors.Add($"Error decoding '{value}': {ex.Message}");
            }
        }

        return (results.ToArray(), errors.ToArray());
    }

    // Get the maximum value that can be encoded for a given length
    public static long GetMaxValueForLength(int length)
    {
        if (length <= 0)
        {
            throw new ArgumentException("Length must be positive");
        }

        return (long)Math.Pow(30, length) - 1;
    }

    // Get the minimum length needed to encode a value
    public static int GetRequiredLength(long value)
    {
        if (value == 0)
        {
            return 1;
        }

        return (int)Math.Ceiling(Math.Log(Math.Abs(value + 1), 30)) + (value < 0 ? 1 : 0);
    }

    // Validate if a string is a valid Base30 encoding
    public static bool IsValidBase30String(string value)
    {
        if (string.IsNullOrEmpty(value))
        {
            return false;
        }

        int startIndex = value[0] == '-' ? 1 : 0;
        if (value.Length == startIndex)
        {
            return false;
        }

        return value.Skip(startIndex).All(c => Constants.Base30.Base30Chars.Contains(c, StringComparison.OrdinalIgnoreCase));
    }

    // Generate a cryptographically secure random Base30 string
    public static string GenerateRandom(int length)
    {
        if (length <= 0)
        {
            throw new ArgumentException("Length must be positive");
        }

        Span<char> buffer = stackalloc char[length];
        Span<byte> randomBytes = stackalloc byte[length];

        RandomNumberGenerator.Fill(randomBytes);

        // Convert random bytes to Base30 characters
        for (int i = 0; i < length; i++)
        {
            // Use modulo bias elimination technique
            // 256 is not perfectly divisible by 30, so we need to eliminate bias
            byte randomByte;
            const byte maxValue = byte.MaxValue - byte.MaxValue % 30;

            do
            {
                randomByte = randomBytes[i];
            } while (randomByte > maxValue); // Reject values that would create bias

            buffer[i] = Constants.Base30.Base30Chars[randomByte % 30];
        }

        return new string(buffer);
    }

    // Generate a cryptographically secure random Base30 string with specified byte entropy
    public static string GenerateRandomWithEntropy(int entropyBytes)
    {
        if (entropyBytes <= 0)
        {
            throw new ArgumentException("Entropy bytes must be positive");
        }

        // Calculate required length to encode entropyBytes bytes in base30
        int length = (int)Math.Ceiling(entropyBytes * 8 * Math.Log(2) / Math.Log(30));

        Span<byte> randomBytes = stackalloc byte[entropyBytes];
        RandomNumberGenerator.Fill(randomBytes);

        // Convert to a large integer and then to base30
        var value = new BigInteger(randomBytes, true);
        Span<char> buffer = stackalloc char[length];
        int position = length - 1;

        while (value > 0 && position >= 0)
        {
            value = BigInteger.DivRem(value, 30, out var remainder);
            buffer[position--] = Constants.Base30.Base30Chars[(int)remainder];
        }

        // Pad with first character if necessary
        while (position >= 0)
        {
            buffer[position--] = Constants.Base30.Base30Chars[0];
        }

        return new string(buffer);
    }

    public static string Encode(long value)
    {
        // Handle zero case
        if (value == 0)
        {
            return "0";
        }

        // Use stackalloc for zero-heap-allocation buffer
        // Safe to use stackalloc here as we know the maximum size is small and fixed
        Span<char> buffer = stackalloc char[Constants.Base30.MaxLength];
        int position = Constants.Base30.MaxLength - 1;

        // Handle negative numbers
        bool isNegative = value < 0;
        if (isNegative)
        {
            value = -value;
        }

        // Convert to base 30
        while (value > 0)
        {
            buffer[position--] = Constants.Base30.Base30Chars[(int)(value % 30)];
            value /= 30;
        }

        // Add negative sign if necessary
        if (isNegative)
        {
            buffer[position--] = Constants.Base30.NegativeSign;
        }

        // Return the slice of the buffer that contains our number
        return new string(buffer.Slice(position + 1));
    }

    public static long Decode(ReadOnlySpan<char> encoded)
    {
        if (encoded.IsEmpty)
        {
            return 0L;
        }

        bool isNegative = encoded[0] == Constants.Base30.NegativeSign;
        int startIndex = isNegative ? 1 : 0;

        if (encoded.Length - startIndex == 0)
        {
            return 0L;
        }

        long result = 0;

        // Process each digit
        for (int i = startIndex; i < encoded.Length; i++)
        {
            // Find the position of the character in our Base30Chars
            int digitValue = Constants.Base30.Base30Chars.IndexOf(encoded[i], StringComparison.OrdinalIgnoreCase);
            if (digitValue == -1)
            {
                throw new ArgumentException($"Invalid character in base 30 string: {encoded[i]}");
            }

            // Check for overflow before performing multiplication
            if (result > long.MaxValue / 30)
            {
                throw new OverflowException("Value too large for Int64");
            }

            result = result * 30 + digitValue;
            if (result < 0) // Check for overflow
            {
                throw new OverflowException("Value too large for Int64");
            }
        }

        return isNegative ? -result : result;
    }
}

public static class Info
{
    public static IReadOnlyList<char> Characters { get; } = Array.AsReadOnly(Constants.Base30.Base30Chars.ToArray());

    public static int Base => Constants.Base30.Base30Chars.Length;

    public static int MaxEncodedLength => Constants.Base30.MaxLength;

    public static long MaxValue => Base30Encoding.GetMaxValueForLength(Constants.Base30.MaxLength - 1); // -1 for sign

    public static long MinValue => -MaxValue;
}
