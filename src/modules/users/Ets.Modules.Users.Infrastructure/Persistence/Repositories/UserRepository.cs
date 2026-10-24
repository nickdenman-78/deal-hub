using Ets.Modules.Users.Domain.Models;
using Ets.Modules.Users.Domain.Repositories;
using Ets.Modules.Users.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;

namespace Ets.Modules.Users.Infrastructure.Persistence.Repositories;

[UsedImplicitly]
internal sealed class UserRepository(UsersDbContext db) : IUserRepository
{
    public Task<User?> FindAsync(UserId id, CancellationToken cancellationToken)
    {
        return db.Users.FirstOrDefaultAsync(user => user.Id == id, cancellationToken);
    }

    public Task<User?> FindByIdentityAsync(IdentityId identityId, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(identityId);

        return db.Users.FirstOrDefaultAsync(user => user.IdentityId == identityId, cancellationToken);
    }

    public async Task<IReadOnlyList<User>> ListAsync(CancellationToken cancellationToken)
    {
        var users = await db.Users
            .AsNoTracking()
            .OrderBy(user => user.UserName)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return users;
    }

    public void Add(User user)
    {
        ArgumentNullException.ThrowIfNull(user);

        db.Users.Add(user);
    }
}
