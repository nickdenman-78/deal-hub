using System.Text.RegularExpressions;
using Ets.Core.Domain.Models;

namespace Ets.Modules.Users.Domain.ValueObjects;

/// <summary>
///     One thing a module lets a caller do, written <c>module:action</c> (<c>deals:capture</c>). Each module
///     declares its own permissions; roles grant them.
/// </summary>
/// <remarks>
///     The same format the architecture tests require of every module's permission catalogue: a lower-case
///     module name, a colon, and a lower-case kebab-case action.
/// </remarks>
public sealed partial record Permission : IValueObject
{
    public const string InvalidErrorCode = "permission.invalid";

    public const int MaxLength = 100;

    private Permission(string value)
    {
        Value = value;
    }

    public string Value { get; }

    public static Result<Permission> Create(string? value)
    {
        if (value is null || value.Length > MaxLength || !Format().IsMatch(value))
        {
            return Result.Failure<Permission>(DomainError.Validation(
                InvalidErrorCode,
                $"A permission is written module:action in lower case, such as deals:capture, not '{value}'."));
        }

        return new Permission(value);
    }

    public override string ToString()
    {
        return Value;
    }

    [GeneratedRegex("^[a-z][a-z0-9]*:[a-z][a-z0-9-]*$")]
    private static partial Regex Format();
}
