namespace Ets.Core.Domain.CQRS;

#pragma warning disable CA1040
#pragma warning disable S2326

/// <summary>
///     A contract for a command, without a response
/// </summary>
public interface ICommand;

/// <summary>
///     A contract for a command with a response
/// </summary>
/// <typeparam name="TResponse">The response type</typeparam>
public interface ICommand<out TResponse>;

#pragma warning restore S2326
#pragma warning restore CA1040
