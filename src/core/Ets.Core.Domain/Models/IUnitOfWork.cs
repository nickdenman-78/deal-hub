namespace Ets.Core.Domain.Models;

/// <summary>
///     Commits a use case: the aggregate's changes and the integration events mapped from its domain
///     events, in one transaction.
/// </summary>
/// <remarks>
///     Implemented per module in Infrastructure over <c>IDbContextOutbox&lt;TContext&gt;</c> (EF Core) or a
///     Marten session with the Wolverine outbox. A module declares its own interface deriving from this one
///     (<c>IDealsUnitOfWork</c>) so a handler cannot be given another module's unit of work. A concurrency
///     conflict is returned as a <see cref="DomainErrorType.Conflict" /> failure, not thrown.
/// </remarks>
public interface IUnitOfWork
{
    Task<Result> SaveChangesAsync(CancellationToken cancellationToken);
}
