using Ets.Core.Domain.Models;
using Ets.Core.Domain.Services;
using Ets.Modules.Users.Domain.Models;
using Ets.Modules.Users.Domain.Repositories;
using Ets.Modules.Users.Domain.ValueObjects;
using Ets.Modules.Users.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Ets.Modules.Users.Infrastructure.Seeding;

/// <summary>
///     When <see cref="UsersDevelopmentSeedOptions.Enabled" />, applies the Users migrations and adds the seeded
///     roles and users before the host starts taking requests (ADR-0010: migrations run at startup in
///     Development only).
/// </summary>
/// <remarks>
///     It goes through the domain and the repositories like any use case, so a seeded role or user obeys the
///     same invariants. A seed that breaks one stops the host: it is configuration the developer must fix.
/// </remarks>
[UsedImplicitly]
internal sealed partial class UsersDevelopmentSeeder(
    IServiceScopeFactory scopes,
    IOptions<UsersDevelopmentSeedOptions> options,
    ILogger<UsersDevelopmentSeeder> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        var seed = options.Value;

        if (!seed.Enabled)
        {
            return;
        }

        var scope = scopes.CreateAsyncScope();

        await using (scope.ConfigureAwait(false))
        {
            var services = scope.ServiceProvider;

            await services.GetRequiredService<UsersDbContext>()
                .Database.MigrateAsync(cancellationToken)
                .ConfigureAwait(false);

            var roles = services.GetRequiredService<IRoleRepository>();
            var users = services.GetRequiredService<IUserRepository>();
            var ids = services.GetRequiredService<IIdGenerator>();
            var clock = services.GetRequiredService<IDateTimeProvider>();

            var roleIds = new Dictionary<string, RoleId>(StringComparer.OrdinalIgnoreCase);

            foreach (var seeded in seed.Roles)
            {
                var role = await SeedRoleAsync(seeded, roles, ids, clock, cancellationToken).ConfigureAwait(false);
                roleIds[role.Name.Value] = role.Id;
            }

            foreach (var seeded in seed.Users)
            {
                await SeedUserAsync(seeded, roleIds, users, ids, clock, cancellationToken).ConfigureAwait(false);
            }

            Ensure(await services.GetRequiredService<IUsersUnitOfWork>()
                .SaveChangesAsync(cancellationToken)
                .ConfigureAwait(false));

            LogSeeded(logger, seed.Roles.Count, seed.Users.Count);
        }
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }

    private static async Task<Role> SeedRoleAsync(
        SeededRole seeded,
        IRoleRepository roles,
        IIdGenerator ids,
        IDateTimeProvider clock,
        CancellationToken cancellationToken)
    {
        var name = Ensure(RoleName.Create(seeded.Name));
        Permission[] permissions = [.. seeded.Permissions.Select(permission => Ensure(Permission.Create(permission)))];

        var role = await roles.FindByNameAsync(name, cancellationToken).ConfigureAwait(false);

        if (role is null)
        {
            role = Role.Create(name, permissions, ids, clock);
            roles.Add(role);

            return role;
        }

        foreach (var permission in permissions.Where(permission => !role.Permissions.Contains(permission)))
        {
            Ensure(role.Grant(permission, clock));
        }

        return role;
    }

    private static async Task SeedUserAsync(
        SeededUser seeded,
        Dictionary<string, RoleId> roleIds,
        IUserRepository users,
        IIdGenerator ids,
        IDateTimeProvider clock,
        CancellationToken cancellationToken)
    {
        var identityId = Ensure(IdentityId.Create(seeded.IdentityId));

        var user = await users.FindByIdentityAsync(identityId, cancellationToken).ConfigureAwait(false);

        if (user is null)
        {
            user = Ensure(User.Register(identityId, seeded.UserName, ids, clock));
            users.Add(user);
        }

        foreach (string roleName in seeded.Roles)
        {
            var roleId = roleIds[roleName];

            if (!user.Holds(roleId))
            {
                Ensure(user.AssignRole(roleId, clock));
            }
        }
    }

    private static void Ensure(Result result)
    {
        if (result.IsFailure)
        {
            throw new InvalidOperationException(
                $"{UsersDevelopmentSeedOptions.SectionName} is invalid: {result.Error!.Description}");
        }
    }

    private static T Ensure<T>(Result<T> result)
    {
        Ensure((Result)result);

        return result.Value;
    }

    [LoggerMessage(Level = LogLevel.Information, Message = "Seeded {RoleCount} Development roles and {UserCount} users")]
    private static partial void LogSeeded(ILogger logger, int roleCount, int userCount);
}
