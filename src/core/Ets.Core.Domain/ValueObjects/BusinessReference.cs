using Ets.Core.Domain.Models;
using Ets.Core.Domain.Specifications;

namespace Ets.Core.Domain.ValueObjects;

/// <summary>
///     A short, quotable, typo-detecting reference people use for things they talk about — deals,
///     settlements, invoices (ADR-0014). Not an id: the Guid v7 is the key, the reference is for humans.
/// </summary>
/// <remarks>
///     <para>
///         Format: a per-type prefix, the Base30 encoding of a value from a per-type PostgreSQL sequence, and
///         a Luhn mod 30 check character — e.g. <c>ETS-D-</c> + <c>X2KW</c> + check.
///     </para>
///     <para>
///         Values are allocated by an Infrastructure port (<c>IDealReferenceGenerator</c>) during the
///         command, never derived from the Guid. <b>A prefix, the sequence base or the alphabet is never
///         changed once references have been issued</b> — every reference already quoted in an email or a
///         confirmation would stop resolving.
///     </para>
///     <para>Subtypes add the prefix and a <c>Create(string)</c> that calls <see cref="IsValid" />.</para>
/// </remarks>
public abstract record BusinessReference : IValueObject
{
    protected BusinessReference(string value)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(value);
        Value = value.ToUpperInvariant();
    }

    public string Value { get; }

    /// <summary>
    ///     Composes a reference value from its prefix and an allocated sequence number.
    /// </summary>
    /// <param name="prefix">The reference type's prefix, e.g. <c>ETS-D-</c>.</param>
    /// <param name="sequence">The value allocated from the type's sequence, plus the type's base.</param>
    public static string Compose(string prefix, long sequence)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(prefix);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(sequence);

        string body = Base30Encoding.Encode(sequence);
        return prefix + body + LuhnModN.CalculateCheckCharacter(body);
    }

    /// <summary>
    ///     Whether <paramref name="value" /> carries <paramref name="prefix" />, a Base30 body and a valid
    ///     check character.
    /// </summary>
    public static bool IsValid(string prefix, string? value)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(prefix);

        if (string.IsNullOrWhiteSpace(value) ||
            !value.StartsWith(prefix, StringComparison.OrdinalIgnoreCase) ||
            value.Length < prefix.Length + 2)
        {
            return false;
        }

        return LuhnModN.IsValid(value.AsSpan(prefix.Length));
    }

    public override string ToString()
    {
        return Value;
    }
}
