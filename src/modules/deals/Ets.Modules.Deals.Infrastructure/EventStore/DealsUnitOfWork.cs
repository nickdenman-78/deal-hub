using Ets.Core.Domain.Models;
using Ets.Modules.Deals.Domain.Repositories;
using JasperFx;

namespace Ets.Modules.Deals.Infrastructure.EventStore;

/// <summary>
///     Appends the uncommitted events of every deal the request touched and saves them in one transaction.
/// </summary>
/// <remarks>
///     A new deal starts its stream; an existing one appends expecting the version it was loaded at, so a
///     concurrent change is returned as a <see cref="DomainErrorType.Conflict" /> rather than overwritten
///     (ADR-0013).
/// </remarks>
[UsedImplicitly]
internal sealed class DealsUnitOfWork(DealsEventSession session) : IDealsUnitOfWork
{
    public const string ConcurrencyConflictErrorCode = "deal.concurrency-conflict";

    public async Task<Result> SaveChangesAsync(CancellationToken cancellationToken)
    {
        var changed = session.Deals.Where(deal => deal.UncommittedEvents.Count > 0).ToArray();

        if (changed.Length == 0)
        {
            return Result.Success();
        }

        foreach (var deal in changed)
        {
            object[] events = [.. deal.UncommittedEvents];

            if (deal.Version == 0)
            {
                session.Session.Events.StartStream(deal.GetType(), deal.Id.Value, events);
            }
            else
            {
                // Marten's expected version is the stream's version once these events are appended.
                session.Session.Events.Append(deal.Id.Value, deal.Version + events.Length, events);
            }
        }

        try
        {
            await session.Session.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        }
        catch (Exception exception) when (IsConcurrencyConflict(exception))
        {
            return Result.Failure(DomainError.Conflict(
                ConcurrencyConflictErrorCode,
                "Someone else changed this deal first. Reload it and try again."));
        }

        foreach (var deal in changed)
        {
            deal.ClearDomainEvents();
        }

        return Result.Success();
    }

    private static bool IsConcurrencyConflict(Exception exception)
    {
        return exception is ConcurrencyException
            or Marten.Exceptions.ExistingStreamIdCollisionException
            or JasperFx.Events.ExistingStreamIdCollisionException;
    }
}
