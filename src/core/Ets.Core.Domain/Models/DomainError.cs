namespace Ets.Core.Domain.Models;

/// <summary>
///     A business outcome that is not success. Carried by <see cref="Result" />, never thrown.
/// </summary>
/// <remarks>
///     Codes are dotted and lower-case (<c>deal.status.illegal-transition</c>, <c>deal.not-found</c>).
///     <see cref="Type" /> decides the HTTP status in <c>ApiResults.Problem</c>.
/// </remarks>
public record DomainError
{
    [UsedImplicitly] public static readonly DomainError None = new(string.Empty, string.Empty, DomainErrorType.Failure);

    [UsedImplicitly] public static readonly DomainError NullValue = new(
        "general.null",
        "Null value was provided",
        DomainErrorType.Failure);

    protected DomainError(string code, string description, DomainErrorType type)
    {
        Code = code;
        Description = description;
        Type = type;
    }

    [UsedImplicitly] public string Code { get; init; }

    [UsedImplicitly] public string Description { get; init; }

    [UsedImplicitly] public DomainErrorType Type { get; init; }

    [UsedImplicitly]
    public static DomainError Create(string code, string description, DomainErrorType type)
    {
        return new DomainError(code, description, type);
    }

    [UsedImplicitly]
    public static DomainError Failure(string code, string description)
    {
        return new DomainError(code, description, DomainErrorType.Failure);
    }

    [UsedImplicitly]
    public static DomainError Validation(string code, string description)
    {
        return new DomainError(code, description, DomainErrorType.Validation);
    }

    [UsedImplicitly]
    public static DomainError NotFound(string code, string description)
    {
        return new DomainError(code, description, DomainErrorType.NotFound);
    }

    [UsedImplicitly]
    public static DomainError Problem(string code, string description)
    {
        return new DomainError(code, description, DomainErrorType.Problem);
    }

    [UsedImplicitly]
    public static DomainError Conflict(string code, string description)
    {
        return new DomainError(code, description, DomainErrorType.Conflict);
    }
}
