namespace Ets.Core.Domain.Models;

public sealed record ValidationError : DomainError
{
    private ValidationError(DomainError[] errors)
        : base(
            "Validation.Error",
            "One or more validation errors occurred.",
            DomainErrorType.Validation)
    {
        Errors = errors;
    }

    public IEnumerable<DomainError> Errors { get; }

    public static ValidationError FromResults(IEnumerable<DomainError> errors)
    {
        return new ValidationError([.. errors.Where(e => e.Type == DomainErrorType.Validation)]);
    }
}
