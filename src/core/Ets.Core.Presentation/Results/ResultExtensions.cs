using Ets.Core.Domain.Models;

namespace Ets.Core.Presentation.Results;

public static class ResultExtensions
{
    /// <summary>
    ///     Projects a <see cref="Result" /> onto one of two outcomes.
    /// </summary>
    /// <remarks>
    ///     Endpoints use this as <c>result.Match(Results.NoContent, ApiResults.Problem)</c>.
    /// </remarks>
    public static TOut Match<TOut>(
        this Result result,
        Func<TOut> onSuccess,
        Func<Result, TOut> onFailure)
    {
        ArgumentNullException.ThrowIfNull(result);
        ArgumentNullException.ThrowIfNull(onSuccess);
        ArgumentNullException.ThrowIfNull(onFailure);

        return result.IsSuccess ? onSuccess() : onFailure(result);
    }

    /// <summary>
    ///     Projects a <see cref="Result{TValue}" /> onto one of two outcomes.
    /// </summary>
    /// <remarks>
    ///     Endpoints use this as <c>result.Match(Results.Ok, ApiResults.Problem)</c>.
    /// </remarks>
    public static TOut Match<TIn, TOut>(
        this Result<TIn> result,
        Func<TIn, TOut> onSuccess,
        Func<Result<TIn>, TOut> onFailure)
    {
        ArgumentNullException.ThrowIfNull(result);
        ArgumentNullException.ThrowIfNull(onSuccess);
        ArgumentNullException.ThrowIfNull(onFailure);

        return result.IsSuccess ? onSuccess(result.Value) : onFailure(result);
    }
}
