using Ets.Modules.Users.Domain.Models;
using Ets.Modules.Users.Domain.ValueObjects;

namespace Ets.Modules.Users.Domain.Repositories;

/// <summary>Loads and stores <see cref="User" /> aggregates. Nothing is written until the unit of work saves.</summary>
public interface IUserRepository
{
    Task<User?> FindAsync(UserId id, CancellationToken cancellationToken);

    Task<User?> FindByIdentityAsync(IdentityId identityId, CancellationToken cancellationToken);

    /// <summary>Every user, ordered by user name. Read only: changes to the users returned are not saved.</summary>
    Task<IReadOnlyList<User>> ListAsync(CancellationToken cancellationToken);

    void Add(User user);
}
