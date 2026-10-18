namespace Ets.Core.Domain.CQRS;

/// <summary>
///     A contract for a query (always has a response)
/// </summary>
/// <typeparam name="TResponse">The response type</typeparam>
#pragma warning disable CA1040
#pragma warning disable S2326
public interface IQuery<out TResponse>;
#pragma warning restore S2326
#pragma warning restore CA1040
