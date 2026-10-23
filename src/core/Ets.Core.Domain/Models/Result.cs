// ReSharper disable MemberCanBePrivate.Global

namespace Ets.Core.Domain.Models;

public class Result
{
    protected Result(bool isSuccess, DomainError error)
    {
        if (isSuccess && error != DomainError.None ||
            !isSuccess && error == DomainError.None)
        {
            throw new ArgumentException("Invalid error", nameof(error));
        }

        IsSuccess = isSuccess;
        Error = error;
    }

    [UsedImplicitly] public bool IsSuccess { get; }

    [UsedImplicitly] public bool IsFailure => !IsSuccess;

    // ReSharper disable once UnusedAutoPropertyAccessor.Global
    [UsedImplicitly] public DomainError? Error { get; }

    [UsedImplicitly]
    public static Result Success()
    {
        return new Result(true, DomainError.None);
    }

    [UsedImplicitly]
    public static Result<TValue> Success<TValue>(TValue value)
    {
        return new Result<TValue>(value, true, DomainError.None);
    }

    [UsedImplicitly]
    public static Result Failure(DomainError error)
    {
        return new Result(false, error);
    }

    [UsedImplicitly]
    public static Result<TValue> Failure<TValue>(DomainError error)
    {
        return new Result<TValue>(default, false, error);
    }
}

public class Result<TValue>(TValue? value, bool isSuccess, DomainError error) : Result(isSuccess, error)
{
    [System.Diagnostics.CodeAnalysis.NotNull]
    public TValue Value => IsSuccess
        ? value!
        : throw new InvalidOperationException("The value of a failure result can't be accessed.");

    public static implicit operator Result<TValue>(TValue? value) =>
        value is not null
            ? Success(value)
            : Failure<TValue>(DomainError.NullValue);

#pragma warning disable CA1000
    [UsedImplicitly]
    public static Result<TValue> ToResult(TValue? value) =>
#pragma warning restore CA1000
        value is not null
            ? Success(value)
            : Failure<TValue>(DomainError.NullValue);

#pragma warning disable CA1000
    [UsedImplicitly]
    public static TValue FromResult(Result<TValue> result) =>
#pragma warning restore CA1000
        result is {IsSuccess: true}
            ? result.Value
            : throw new InvalidOperationException("The value of a failure result can't be accessed.");

#pragma warning disable CA1000
    [UsedImplicitly]
    public static Result<TValue> ValidationFailure(DomainError error) =>
#pragma warning restore CA1000
        new(default, false, error);
}
