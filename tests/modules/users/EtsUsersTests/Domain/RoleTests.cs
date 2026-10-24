using Ets.Modules.Users.Domain.Events;
using Ets.Modules.Users.Domain.Models;
using Ets.Modules.Users.Domain.ValueObjects;

namespace EtsUsersTests.Domain;

public sealed class RoleTests
{
    [Fact]
    public void Create_GrantsEachPermissionOnce_AndRaises_RoleCreated()
    {
        var role = Role.Create(
            RoleName.Create("Trader").Value,
            [Granted("deals:read"), Granted("deals:capture"), Granted("deals:read")],
            new NewGuidV7(),
            TestClock.Frozen);

        role.Permissions.Select(permission => permission.Value).ShouldBe(["deals:read", "deals:capture"]);
        var created = role.DomainEvents.ShouldHaveSingleItem().ShouldBeOfType<RoleCreated>();
        created.RoleId.ShouldBe(role.Id);
        created.Permissions.Count.ShouldBe(2);
        created.OccurredAt.ShouldBe(TestClock.Now);
    }

    [Fact]
    public void Grant_Adds_APermission()
    {
        var role = Trader();

        role.Grant(Granted("deals:confirm"), TestClock.Frozen).IsSuccess.ShouldBeTrue();

        role.Permissions.ShouldContain(Granted("deals:confirm"));
        role.DomainEvents.Last().ShouldBeOfType<PermissionGranted>();
    }

    [Fact]
    public void Grant_Fails_WhenAlreadyGranted()
    {
        var role = Trader();

        role.Grant(Granted("deals:capture"), TestClock.Frozen).Error!.Code.ShouldBe(Role.AlreadyGrantedErrorCode);
        role.Permissions.Count.ShouldBe(1);
    }

    [Fact]
    public void Revoke_Removes_APermission()
    {
        var role = Trader();

        role.Revoke(Granted("deals:capture"), TestClock.Frozen).IsSuccess.ShouldBeTrue();

        role.Permissions.ShouldBeEmpty();
        role.DomainEvents.Last().ShouldBeOfType<PermissionRevoked>();
    }

    [Fact]
    public void Revoke_Fails_WhenNotGranted()
    {
        Trader().Revoke(Granted("deals:confirm"), TestClock.Frozen).Error!.Code.ShouldBe(Role.NotGrantedErrorCode);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("  ")]
    public void RoleName_Fails_WhenBlank(string? value)
    {
        RoleName.Create(value).Error!.Code.ShouldBe(RoleName.InvalidErrorCode);
    }

    private static Role Trader()
    {
        return Role.Create(
            RoleName.Create("Trader").Value,
            [Granted("deals:capture")],
            new NewGuidV7(),
            TestClock.Frozen);
    }

    private static Permission Granted(string value)
    {
        return Permission.Create(value).Value;
    }
}
