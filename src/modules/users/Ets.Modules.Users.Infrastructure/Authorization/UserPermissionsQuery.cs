using Ets.Modules.Users.Domain.ValueObjects;
using Ets.Modules.Users.Infrastructure.Persistence;
using Ets.Modules.Users.IntegrationEvents.Authorization;
using Microsoft.EntityFrameworkCore;

namespace Ets.Modules.Users.Infrastructure.Authorization;

/// <summary>
///     Reads a user's permissions in one query: their role assignments joined to the permissions those roles
///     grant.
/// </summary>
[UsedImplicitly]
internal sealed class UserPermissionsQuery(UsersDbContext db) : IUserPermissionsQuery
{
    public async Task<IReadOnlyList<string>> GetPermissionsAsync(
        string identityId,
        CancellationToken cancellationToken)
    {
        var identity = IdentityId.Create(identityId);

        if (identity.IsFailure)
        {
            return [];
        }

        var id = identity.Value;

        var permissions = await db.Users
            .AsNoTracking()
            .Where(user => user.IdentityId == id)
            .SelectMany(user => user.RoleAssignments)
            .Join(db.Roles, assignment => assignment.RoleId, role => role.Id, (_, role) => role)
            .SelectMany(role => role.Permissions)
            .Select(permission => permission.Value)
            .Distinct()
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return [.. permissions.Order(StringComparer.Ordinal)];
    }
}
