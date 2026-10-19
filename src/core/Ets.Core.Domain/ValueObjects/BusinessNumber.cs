namespace Ets.Core.Domain.ValueObjects;

/// <summary>Normalisation shared by <see cref="ABN" /> and <see cref="ACN" />.</summary>
internal static class BusinessNumber
{
    /// <summary>Drops the spaces and hyphens people write ABNs and ACNs with.</summary>
    public static string Digits(string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? string.Empty
            : string.Concat(value.Where(character => !char.IsWhiteSpace(character) && character != '-'));
    }
}
