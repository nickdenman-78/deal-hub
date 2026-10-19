// Licensed to the.NET Foundation under one or more agreements.
// The.NET Foundation licenses this file to you under the MIT license.

namespace Ets.Core.Domain.ValueObjects;

public sealed record EmailAddress
{
    private EmailAddress(string? value)
    {
        if (!string.IsNullOrWhiteSpace(value) &&
            (!value.Contains('@', StringComparison.InvariantCulture) ||
             value.StartsWith('@') ||
             value.IndexOf('@', StringComparison.InvariantCulture) == value.Length - 1))
        {
            throw new ArgumentException("Invalid email address format", nameof(value));
        }

        // email addresses are case-insensitive and represented in lowercase
#pragma warning disable CA1308
        Value = value?.Trim().ToLowerInvariant();
        IsValid = !string.IsNullOrEmpty(value);
#pragma warning restore CA1308
    }

    [UsedImplicitly] public static EmailAddress Empty => new((string?)null);

    [UsedImplicitly] public bool IsValid { get; init; }

    [UsedImplicitly] public string? Value { get; init; }

    [UsedImplicitly]
    public static EmailAddress Create(string? value)
    {
        return new EmailAddress(value);
    }

    public override string ToString()
    {
        return Value ?? string.Empty;
    }
}
