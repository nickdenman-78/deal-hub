using Ets.Core.Domain.Models;

namespace Ets.Modules.Users.Domain.ValueObjects;

/// <summary>The name people know a role by, such as <c>Trader</c>.</summary>
public sealed record RoleName : IValueObject
{
    public const string InvalidErrorCode = "role.name.invalid";

    public const int MaxLength = 100;

    private RoleName(string value)
    {
        Value = value;
    }

    public string Value { get; }

    public static Result<RoleName> Create(string? value)
    {
        string trimmed = value?.Trim() ?? string.Empty;

        if (trimmed.Length is 0 or > MaxLength)
        {
            return Result.Failure<RoleName>(DomainError.Validation(
                InvalidErrorCode,
                $"A role name is 1 to {MaxLength} characters, not '{value}'."));
        }

        return new RoleName(trimmed);
    }

    public override string ToString()
    {
        return Value;
    }
}
