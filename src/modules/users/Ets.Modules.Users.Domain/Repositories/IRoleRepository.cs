using Ets.Modules.Users.Domain.Models;
using Ets.Modules.Users.Domain.ValueObjects;

namespace Ets.Modules.Users.Domain.Repositories;

/// <summary>Loads and stores <see cref="Role" /> aggregates. Nothing is written until the unit of work saves.</summary>
public interface IRoleRepository
{
    Task<Role?> FindAsync(RoleId id, CancellationToken cancellationToken);

    Task<Role?> FindByNameAsync(RoleName name, CancellationToken cancellationToken);

    /// <summary>Every role, ordered by name. Read only: changes to the roles returned are not saved.</summary>
    Task<IReadOnlyList<Role>> ListAsync(CancellationToken cancellationToken);

    void Add(Role role);
}
