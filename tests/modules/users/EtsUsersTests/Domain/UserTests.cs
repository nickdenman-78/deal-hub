using Ets.Modules.Users.Domain.Events;
using Ets.Modules.Users.Domain.Models;
using Ets.Modules.Users.Domain.ValueObjects;

namespace EtsUsersTests.Domain;

public sealed class UserTests
{
    private static readonly RoleId Trader = new(Guid.CreateVersion7());

    [Fact]
    public void Register_Raises_UserRegistered()
    {
        var user = Register();

        user.UserName.ShouldBe("trader");
        user.RoleAssignments.ShouldBeEmpty();
        user.DomainEvents.ShouldHaveSingleItem().ShouldBeOfType<UserRegistered>().UserId.ShouldBe(user.Id);
    }

    [Theory]
    [InlineData(null)]
    [InlineData(" ")]
    public void Register_Fails_WithoutAUserName(string? userName)
    {
        User.Register(Identity(), userName, new NewGuidV7(), TestClock.Frozen)
            .Error!.Code.ShouldBe(User.UserNameInvalidErrorCode);
    }

    [Fact]
    public void IdentityId_Fails_WhenBlank()
    {
        IdentityId.Create("").Error!.Code.ShouldBe(IdentityId.InvalidErrorCode);
    }

    [Fact]
    public void AssignRole_Records_WhenItWasAssigned()
    {
        var user = Register();

        user.AssignRole(Trader, TestClock.Frozen).IsSuccess.ShouldBeTrue();

        user.Holds(Trader).ShouldBeTrue();
        user.RoleAssignments.ShouldHaveSingleItem().ShouldBe(new RoleAssignment(Trader, TestClock.Now));
        user.DomainEvents.Last().ShouldBeOfType<RoleAssigned>();
    }

    [Fact]
    public void AssignRole_Fails_WhenAlreadyHeld()
    {
        var user = Register();
        user.AssignRole(Trader, TestClock.Frozen);

        user.AssignRole(Trader, TestClock.Frozen).Error!.Code.ShouldBe(User.AlreadyAssignedErrorCode);
        user.RoleAssignments.Count.ShouldBe(1);
    }

    [Fact]
    public void UnassignRole_Removes_TheRole()
    {
        var user = Register();
        user.AssignRole(Trader, TestClock.Frozen);

        user.UnassignRole(Trader, TestClock.Frozen).IsSuccess.ShouldBeTrue();

        user.Holds(Trader).ShouldBeFalse();
        user.DomainEvents.Last().ShouldBeOfType<RoleUnassigned>();
    }

    [Fact]
    public void UnassignRole_Fails_WhenNotHeld()
    {
        Register().UnassignRole(Trader, TestClock.Frozen).Error!.Code.ShouldBe(User.NotAssignedErrorCode);
    }

    private static User Register()
    {
        return User.Register(Identity(), " trader ", new NewGuidV7(), TestClock.Frozen).Value;
    }

    private static IdentityId Identity()
    {
        return IdentityId.Create("9a7c2f61-6c1b-4d0e-8f3a-2b5d4e6f7a81").Value;
    }
}
