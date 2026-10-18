using Microsoft.AspNetCore.Http;
using Ets.Core.Domain.Models;
using HttpResults = Microsoft.AspNetCore.Http.Results;

namespace Ets.Core.Presentation.Results;

/// <summary>
///     Translates a failed <see cref="Result" /> into an RFC 7807 problem response.
/// </summary>
public static class ApiResults
{
    /// <summary>
    ///     Maps the failure carried by <paramref name="result" /> onto a problem response.
    /// </summary>
    /// <param name="result">A failed result. Passing a successful result is a programming error.</param>
    /// <returns>An <see cref="IResult" /> carrying the RFC 7807 payload.</returns>
    /// <exception cref="InvalidOperationException">The result is successful.</exception>
    public static IResult Problem(Result result)
    {
        ArgumentNullException.ThrowIfNull(result);

        if (result.IsSuccess)
        {
            throw new InvalidOperationException("A successful result cannot be converted to a problem response.");
        }

        // Result.Error is nullable; a failure should always carry one, but fall back rather than throw
        // a NullReferenceException from inside the error path.
        var error = result.Error ?? DomainError.Failure("General.Unknown", "An unexpected error occurred.");

        return HttpResults.Problem(
            GetDetail(error),
            null,
            GetStatusCode(error.Type),
            GetTitle(error),
            GetProblemType(error.Type),
            GetExtensions(error));
    }

    private static Dictionary<string, object?>? GetExtensions(DomainError error)
    {
        return error is ValidationError validationError
            ? new Dictionary<string, object?> {["errors"] = validationError.Errors}
            : null;
    }

    // Failure is the catch-all for unexpected server-side problems, so its code and description are
    // internal detail and must not reach the caller. Every other type is a deliberate domain outcome.
    private static string GetDetail(DomainError error)
    {
        return error.Type is DomainErrorType.Failure
            ? "An unexpected error occurred."
            : error.Description;
    }

    private static string GetProblemType(DomainErrorType type)
    {
        return type switch
        {
            DomainErrorType.Validation => "https://tools.ietf.org/html/rfc7231#section-6.5.1",
            DomainErrorType.Problem => "https://tools.ietf.org/html/rfc7231#section-6.5.1",
            DomainErrorType.NotFound => "https://tools.ietf.org/html/rfc7231#section-6.5.4",
            DomainErrorType.Conflict => "https://tools.ietf.org/html/rfc7231#section-6.5.8",
            _ => "https://tools.ietf.org/html/rfc7231#section-6.6.1"
        };
    }

    private static int GetStatusCode(DomainErrorType type)
    {
        return type switch
        {
            DomainErrorType.Validation => StatusCodes.Status400BadRequest,
            DomainErrorType.Problem => StatusCodes.Status400BadRequest,
            DomainErrorType.NotFound => StatusCodes.Status404NotFound,
            DomainErrorType.Conflict => StatusCodes.Status409Conflict,
            _ => StatusCodes.Status500InternalServerError
        };
    }

    private static string GetTitle(DomainError error)
    {
        return error.Type is DomainErrorType.Failure
            ? "Server failure"
            : error.Code;
    }
}
