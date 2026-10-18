using JetBrains.Annotations;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Ets.Core.Presentation.Middleware;

/// <summary>
///     Last-resort handler for exceptions that escape a slice. Domain failures should travel as
///     <see cref="Ets.Core.Domain.Models.Result" /> and be shaped by
///     <see cref="Results.ApiResults" />; reaching here means something genuinely unexpected happened.
/// </summary>
/// <remarks>
///     Requires <c>AddProblemDetails()</c> and <c>UseExceptionHandler()</c> in the host pipeline.
/// </remarks>
[UsedImplicitly]
public sealed class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(httpContext);

        LogMessages.UnhandledException(logger, exception);

        // Deliberately opaque: the exception message may carry connection strings, SQL or PII.
        // The correlated detail is in the log, not the response.
        var problemDetails = new ProblemDetails
        {
            Status = StatusCodes.Status500InternalServerError,
            Title = "Server failure",
            Detail = "An unexpected error occurred.",
            Type = "https://tools.ietf.org/html/rfc7231#section-6.6.1"
        };

        httpContext.Response.StatusCode = problemDetails.Status.Value;

        await httpContext.Response
            .WriteAsJsonAsync(problemDetails, cancellationToken)
            .ConfigureAwait(false);

        return true;
    }

    private static class LogMessages
    {
        public static readonly Action<ILogger, Exception?> UnhandledException =
            LoggerMessage.Define(
                LogLevel.Error,
                new EventId(5000, nameof(UnhandledException)),
                "Unhandled exception escaped the request pipeline");
    }
}
