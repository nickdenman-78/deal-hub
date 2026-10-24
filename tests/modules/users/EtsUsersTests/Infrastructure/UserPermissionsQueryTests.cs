using Ets.Modules.Users.Domain.Models;
using Ets.Modules.Users.Domain.ValueObjects;
using Ets.Modules.Users.Infrastructure.Authorization;
using Ets.Modules.Users.Infrastructure.Persistence;
using Ets.Modules.Users.Infrastructure.Persistence.Repositories;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace EtsUsersTests.Infrastructure;

/// <summary>
///     Runs the EF Core mapping and the permissions query against SQLite in memory. PostgreSQL-specific
///     behaviour (schemas, unique-violation codes) is left to integration tests.
/// </summary>
public sealed class UserPermissionsQueryTests : IAsyncLifetime
{
    private const string TraderIdentity = "9a7c2f61-6c1b-4d0e-8f3a-2b5d4e6f7a81";

    private readonly SqliteConnection _connection = new("DataSource=:memory:");

    public async ValueTask InitializeAsync()
    {
        await _connection.OpenAsync(TestContext.Current.CancellationToken);

        await using var db = CreateContext();
        await db.Database.EnsureCreatedAsync(TestContext.Current.CancellationToken);

        var trader = CreateRole("Trader", "deals:read", "deals:capture");
        var operations = CreateRole("Operations", "deals:read", "deals:confirm");
        CreateRole("Administrator", "users:manage");

        var user = User.Register(IdentityId.Create(TraderIdentity).Value, "trader", new NewGuidV7(), TestClock.Frozen)
            .Value;
        user.AssignRole(trader.Id, TestClock.Frozen);
        user.AssignRole(operations.Id, TestClock.Frozen);
        db.Users.Add(user);

        await db.SaveChangesAsync(TestContext.Current.CancellationToken);

        Role CreateRole(string name, params string[] permissions)
        {
            var role = Role.Create(
                RoleName.Create(name).Value,
                permissions.Select(permission => Permission.Create(permission).Value),
                new NewGuidV7(),
                TestClock.Frozen);
            db.Roles.Add(role);

            return role;
        }
    }

    public async ValueTask DisposeAsync()
    {
        await _connection.DisposeAsync();
    }

    [Fact]
    public async Task GetPermissions_Returns_EveryPermissionTheUsersRolesGrant_Once()
    {
        await using var db = CreateContext();

        var permissions = await new UserPermissionsQuery(db)
            .GetPermissionsAsync(TraderIdentity, TestContext.Current.CancellationToken);

        permissions.ShouldBe(["deals:capture", "deals:confirm", "deals:read"]);
    }

    [Theory]
    [InlineData("someone-else")]
    [InlineData("")]
    public async Task GetPermissions_Returns_Nothing_ForAnIdentityWithNoUser(string identityId)
    {
        await using var db = CreateContext();

        var permissions = await new UserPermissionsQuery(db)
            .GetPermissionsAsync(identityId, TestContext.Current.CancellationToken);

        permissions.ShouldBeEmpty();
    }

    [Fact]
    public async Task Role_RoundTrips_WithItsPermissions()
    {
        await using var db = CreateContext();

        var role = await db.Roles.SingleAsync(
            role => role.Name == RoleName.Create("Trader").Value,
            TestContext.Current.CancellationToken);

        role.Permissions.Select(permission => permission.Value).Order().ShouldBe(["deals:capture", "deals:read"]);
    }

    [Fact]
    public async Task RoleRepository_Lists_EveryRole_ByName()
    {
        await using var db = CreateContext();

        var roles = await new RoleRepository(db).ListAsync(TestContext.Current.CancellationToken);

        roles.Select(role => role.Name.Value).ShouldBe(["Administrator", "Operations", "Trader"]);
    }

    [Fact]
    public async Task UserRepository_Finds_AUser_WithTheirRoles()
    {
        await using var db = CreateContext();
        var trader = await new UserRepository(db).FindByIdentityAsync(
            IdentityId.Create(TraderIdentity).Value,
            TestContext.Current.CancellationToken);

        var found = await new UserRepository(db).FindAsync(trader!.Id, TestContext.Current.CancellationToken);

        found.ShouldNotBeNull().RoleAssignments.Count.ShouldBe(2);
    }

    private UsersDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<UsersDbContext>()
            .UseSqlite(_connection)
            .UseSnakeCaseNamingConvention()
            .Options;

        return new UsersDbContext(options);
    }
}
