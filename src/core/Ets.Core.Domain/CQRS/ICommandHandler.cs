using Ets.Core.Domain.Models;

namespace Ets.Core.Domain.CQRS;

/// <summary>
///     A contract for a command handler without a response
/// </summary>
/// <typeparam name="TCommand">The command to handle</typeparam>
public interface ICommandHandler<in TCommand>
    where TCommand : ICommand
{
    Task<Result> HandleAsync(TCommand command, CancellationToken cancellationToken);
}

/// <summary>
///     A contract for a command handler with a response
/// </summary>
/// <typeparam name="TCommand"> The command to handle</typeparam>
/// <typeparam name="TResponse">The response type</typeparam>
public interface ICommandHandler<in TCommand, TResponse>
    where TCommand : ICommand<TResponse>
{
    Task<Result<TResponse>> HandleAsync(TCommand command, CancellationToken cancellationToken);
}
