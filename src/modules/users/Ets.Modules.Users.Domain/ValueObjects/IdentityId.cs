using Ets.Core.Domain.Models;

namespace Ets.Modules.Users.Domain.ValueObjects;

/// <summary>
///     The subject (<c>sub</c> claim) Keycloak issues for a person. It links a signed-in caller to their user.
/// </summary>
public sealed record IdentityId : IValueObject
{
    public const string InvalidErrorCode = "user.identity-id.invalid";

    /// <summary>Keycloak subjects are UUIDs; other identity providers issue longer opaque strings.</summary>
    public const int MaxLength = 255;

    private IdentityId(string value)
    {
        Value = value;
    }

    public string Value { get; }

    public static Result<IdentityId> Create(string? value)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Length > MaxLength)
        {
            return Result.Failure<IdentityId>(DomainError.Validation(
                InvalidErrorCode,
                $"An identity id is 1 to {MaxLength} characters, not '{value}'."));
        }

        return new IdentityId(value.Trim());
    }

    public override string ToString()
    {
        return Value;
    }
}
