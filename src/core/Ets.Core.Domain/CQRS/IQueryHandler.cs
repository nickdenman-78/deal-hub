using Ets.Core.Domain.Models;

namespace Ets.Core.Domain.CQRS;

/// <summary>
///     A contract for a query handler
/// </summary>
/// <typeparam name="TQuery">The query to handle</typeparam>
/// <typeparam name="TResponse">The response type</typeparam>
public interface IQueryHandler<in TQuery, TResponse>
    where TQuery : IQuery<TResponse>
{
    Task<Result<TResponse>> HandleAsync(TQuery query, CancellationToken cancellationToken);
}
