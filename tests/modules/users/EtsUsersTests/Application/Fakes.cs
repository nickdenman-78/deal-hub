using Ets.Core.Domain.Models;
using Ets.Modules.Users.Domain.Models;
using Ets.Modules.Users.Domain.Repositories;
using Ets.Modules.Users.Domain.ValueObjects;

namespace EtsUsersTests.Application;

internal sealed class FakeRoleRepository : IRoleRepository
{
    public List<Role> Roles { get; } = [];

    public List<Role> Added { get; } = [];

    public Task<Role?> FindAsync(RoleId id, CancellationToken cancellationToken)
    {
        return Task.FromResult(Roles.Find(role => role.Id == id));
    }

    public Task<Role?> FindByNameAsync(RoleName name, CancellationToken cancellationToken)
    {
        return Task.FromResult(Roles.Find(role => role.Name == name));
    }

    public Task<IReadOnlyList<Role>> ListAsync(CancellationToken cancellationToken)
    {
        return Task.FromResult<IReadOnlyList<Role>>([.. Roles.OrderBy(role => role.Name.Value, StringComparer.OrdinalIgnoreCase)]);
    }

    public void Add(Role role)
    {
        Roles.Add(role);
        Added.Add(role);
    }

    public Role Seed(string name, params string[] permissions)
    {
        var role = Role.Create(
            RoleName.Create(name).Value,
            permissions.Select(permission => Permission.Create(permission).Value),
            new NewGuidV7(),
            TestClock.Frozen);
        role.ClearDomainEvents();
        Roles.Add(role);

        return role;
    }
}

internal sealed class FakeUserRepository : IUserRepository
{
    public List<User> Users { get; } = [];

    public List<User> Added { get; } = [];

    public Task<User?> FindAsync(UserId id, CancellationToken cancellationToken)
    {
        return Task.FromResult(Users.Find(user => user.Id == id));
    }

    public Task<User?> FindByIdentityAsync(IdentityId identityId, CancellationToken cancellationToken)
    {
        return Task.FromResult(Users.Find(user => user.IdentityId == identityId));
    }

    public Task<IReadOnlyList<User>> ListAsync(CancellationToken cancellationToken)
    {
        return Task.FromResult<IReadOnlyList<User>>([.. Users.OrderBy(user => user.UserName, StringComparer.Ordinal)]);
    }

    public void Add(User user)
    {
        Users.Add(user);
        Added.Add(user);
    }

    public User Seed(string userName, params Role[] roles)
    {
        var user = User.Register(
                IdentityId.Create(Guid.NewGuid().ToString()).Value,
                userName,
                new NewGuidV7(),
                TestClock.Frozen)
            .Value;

        foreach (var role in roles)
        {
            user.AssignRole(role.Id, TestClock.Frozen);
        }

        user.ClearDomainEvents();
        Users.Add(user);

        return user;
    }
}

internal sealed class FakeUnitOfWork : IUsersUnitOfWork
{
    public int Saves { get; private set; }

    public Result Outcome { get; set; } = Result.Success();

    public Task<Result> SaveChangesAsync(CancellationToken cancellationToken)
    {
        Saves++;

        return Task.FromResult(Outcome);
    }
}
