using Ets.Core.Domain.Models;
using Ets.Modules.Users.Domain.Repositories;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Ets.Modules.Users.Infrastructure.Persistence;

/// <summary>
///     Saves the request's users and roles in one transaction. A concurrent change or a taken role name or
///     identity is returned as a <see cref="DomainErrorType.Conflict" />, not thrown.
/// </summary>
[UsedImplicitly]
internal sealed class UsersUnitOfWork(UsersDbContext db) : IUsersUnitOfWork
{
    public const string ConflictErrorCode = "users.save-conflict";

    public async Task<Result> SaveChangesAsync(CancellationToken cancellationToken)
    {
        try
        {
            await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        }
        catch (DbUpdateException exception) when (IsConflict(exception))
        {
            return Result.Failure(DomainError.Conflict(
                ConflictErrorCode,
                "Someone else changed these users or roles first, or the role name or identity is already taken."));
        }

        foreach (var root in db.ChangeTracker.Entries().Select(entry => entry.Entity).OfType<IAggregateRoot>())
        {
            root.ClearDomainEvents();
        }

        return Result.Success();
    }

    private static bool IsConflict(DbUpdateException exception)
    {
        return exception is DbUpdateConcurrencyException ||
               exception.InnerException is PostgresException {SqlState: PostgresErrorCodes.UniqueViolation};
    }
}
