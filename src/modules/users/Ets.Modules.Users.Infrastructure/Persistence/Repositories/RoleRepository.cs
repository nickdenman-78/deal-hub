using Ets.Modules.Users.Domain.Models;
using Ets.Modules.Users.Domain.Repositories;
using Ets.Modules.Users.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;

namespace Ets.Modules.Users.Infrastructure.Persistence.Repositories;

[UsedImplicitly]
internal sealed class RoleRepository(UsersDbContext db) : IRoleRepository
{
    public Task<Role?> FindAsync(RoleId id, CancellationToken cancellationToken)
    {
        return db.Roles.FirstOrDefaultAsync(role => role.Id == id, cancellationToken);
    }

    public Task<Role?> FindByNameAsync(RoleName name, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(name);

        return db.Roles.FirstOrDefaultAsync(role => role.Name == name, cancellationToken);
    }

    public async Task<IReadOnlyList<Role>> ListAsync(CancellationToken cancellationToken)
    {
        var roles = await db.Roles
            .AsNoTracking()
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        // Ordered here rather than in SQL: the name is a value object, which EF Core cannot sort on.
        return [.. roles.OrderBy(role => role.Name.Value, StringComparer.OrdinalIgnoreCase)];
    }

    public void Add(Role role)
    {
        ArgumentNullException.ThrowIfNull(role);

        db.Roles.Add(role);
    }
}
