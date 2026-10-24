using System.Diagnostics;
using Ets.Core.Domain.CQRS;
using Ets.Core.Domain.Models;
using Microsoft.Extensions.Logging;
using Serilog.Context;
using static Ets.Core.Domain.LogEventIds;

namespace Ets.Core.Domain.Decorators;

#pragma warning disable CA1812 // Internal class is never instantiated; it's instantiated by the DI container

/// <summary>
///     Outermost CQRS decorator: logs each command and query by name, and stamps the log context and the
///     current trace with the module and request name (ADR-0016).
/// </summary>
/// <remarks>
///     Only names and error codes are logged. Command payloads carry prices, volumes and counterparty data,
///     which must not reach Information-level logs.
/// </remarks>
internal static class LoggingDecorator
{
    private const string ModulesNamespace = "Ets.Modules.";

    private static async Task<TResult> ExecuteAsync<TResult>(
        ILogger logger,
        Type requestType,
        bool isQuery,
        Func<Task<TResult>> next)
        where TResult : Result
    {
        string requestName = requestType.Name;
        string module = ModuleOf(requestType);

        using (LogContext.PushProperty("Module", module))
        using (LogContext.PushProperty("RequestName", requestName))
        {
            Activity.Current?.SetTag("ets.module", module);
            Activity.Current?.SetTag("ets.request", requestName);

            (isQuery ? LogMessages.ProcessingQuery : LogMessages.ProcessingCommand)(logger, requestName, null);

            var result = await next().ConfigureAwait(false);

            if (result.IsSuccess)
            {
                (isQuery ? LogMessages.CompletedQuery : LogMessages.CompletedCommand)(logger, requestName, null);
            }
            else
            {
                Activity.Current?.SetTag("ets.error.code", result.Error?.Code);

                using (LogContext.PushProperty("Error", result.Error, true))
                {
                    (isQuery ? LogMessages.CompletedQueryWithError : LogMessages.CompletedCommandWithError)(
                        logger,
                        requestName,
                        null);
                }
            }

            return result;
        }
    }

    /// <summary>
    ///     The module a request belongs to, read from its namespace (<c>Ets.Modules.Deals.Application…</c>
    ///     → <c>Deals</c>). Anything outside a module is reported as <c>Core</c>.
    /// </summary>
    private static string ModuleOf(Type requestType)
    {
        string? ns = requestType.Namespace;

        if (ns is null || !ns.StartsWith(ModulesNamespace, StringComparison.Ordinal))
        {
            return "Core";
        }

        string rest = ns[ModulesNamespace.Length..];
        int dot = rest.IndexOf('.', StringComparison.Ordinal);
        return dot < 0 ? rest : rest[..dot];
    }

    [UsedImplicitly]
    internal sealed class CommandHandler<TCommand, TResponse>(
        ICommandHandler<TCommand, TResponse> decorated,
        ILoggerFactory loggerFactory)
        : ICommandHandler<TCommand, TResponse>
        where TCommand : ICommand<TResponse>
    {
        private readonly ILogger _logger = loggerFactory.CreateLogger<ICommandHandler<TCommand, TResponse>>();

        public Task<Result<TResponse>> HandleAsync(TCommand command, CancellationToken cancellationToken)
        {
            return ExecuteAsync(
                _logger,
                typeof(TCommand),
                false,
                () => decorated.HandleAsync(command, cancellationToken));
        }
    }

    [UsedImplicitly]
    internal sealed class CommandBaseHandler<TCommand>(
        ICommandHandler<TCommand> decorated,
        ILoggerFactory loggerFactory)
        : ICommandHandler<TCommand>
        where TCommand : ICommand
    {
        private readonly ILogger _logger = loggerFactory.CreateLogger<ICommandHandler<TCommand>>();

        public Task<Result> HandleAsync(TCommand command, CancellationToken cancellationToken)
        {
            return ExecuteAsync(
                _logger,
                typeof(TCommand),
                false,
                () => decorated.HandleAsync(command, cancellationToken));
        }
    }

    [UsedImplicitly]
    internal sealed class QueryHandler<TQuery, TResponse>(
        IQueryHandler<TQuery, TResponse> decorated,
        ILoggerFactory loggerFactory)
        : IQueryHandler<TQuery, TResponse>
        where TQuery : IQuery<TResponse>
    {
        private readonly ILogger _logger = loggerFactory.CreateLogger<IQueryHandler<TQuery, TResponse>>();

        public Task<Result<TResponse>> HandleAsync(TQuery query, CancellationToken cancellationToken)
        {
            return ExecuteAsync(
                _logger,
                typeof(TQuery),
                true,
                () => decorated.HandleAsync(query, cancellationToken));
        }
    }

    private static class LogMessages
    {
        public static readonly Action<ILogger, string, Exception?> ProcessingQuery =
            LoggerMessage.Define<string>(
                LogLevel.Information,
                QueryProcessing,
                "Processing query {QueryName}");

        public static readonly Action<ILogger, string, Exception?> CompletedQuery =
            LoggerMessage.Define<string>(
                LogLevel.Information,
                QueryProcessed,
                "Completed query {QueryName}");

        public static readonly Action<ILogger, string, Exception?> CompletedQueryWithError =
            LoggerMessage.Define<string>(
                LogLevel.Error,
                QueryFailed,
                "Completed query {QueryName} with error");

        public static readonly Action<ILogger, string, Exception?> ProcessingCommand =
            LoggerMessage.Define<string>(
                LogLevel.Information,
                CommandProcessing,
                "Processing command {CommandName}");

        public static readonly Action<ILogger, string, Exception?> CompletedCommand =
            LoggerMessage.Define<string>(
                LogLevel.Information,
                CommandProcessed,
                "Completed command {CommandName}");

        public static readonly Action<ILogger, string, Exception?> CompletedCommandWithError =
            LoggerMessage.Define<string>(
                LogLevel.Error,
                CommandFailed,
                "Completed command {CommandName} with error");
    }
}

#pragma warning restore CA1812
