using Ets.Core.Domain.Models;
using Ets.Modules.Users.Application.Roles;
using Ets.Modules.Users.Application.Users;
using Ets.Modules.Users.Application.Users.AssignRole;
using Ets.Modules.Users.Application.Users.GetUser;
using Ets.Modules.Users.Application.Users.ListUsers;
using Ets.Modules.Users.Application.Users.RegisterUser;
using Ets.Modules.Users.Application.Users.UnassignRole;
using Ets.Modules.Users.Domain.Events;
using Ets.Modules.Users.Domain.Models;

namespace EtsUsersTests.Application;

public sealed class UserUseCaseTests
{
    private const string Identity = "0b2f6c1e-7d4a-4c9b-8e35-5a1d2f3c4b6e";

    private readonly FakeRoleRepository _roles = new();
    private readonly FakeUserRepository _users = new();
    private readonly FakeUnitOfWork _unitOfWork = new();

    private static CancellationToken Token => TestContext.Current.CancellationToken;

    [Fact]
    public async Task RegisterUser_Registers_AndSaves_TheUser()
    {
        var result = await RegisterHandler().HandleAsync(new RegisterUserCommand(Identity, "trader"), Token);

        var user = _users.Added.ShouldHaveSingleItem();
        result.Value.ShouldBe(user.Id.Value);
        user.IdentityId.Value.ShouldBe(Identity);
        user.RoleAssignments.ShouldBeEmpty();
        user.DomainEvents.ShouldHaveSingleItem().ShouldBeOfType<UserRegistered>();
        _unitOfWork.Saves.ShouldBe(1);
    }

    [Fact]
    public async Task RegisterUser_Fails_WhenTheIdentityIsRegistered()
    {
        await RegisterHandler().HandleAsync(new RegisterUserCommand(Identity, "trader"), Token);

        var result = await RegisterHandler().HandleAsync(new RegisterUserCommand(Identity, "someone"), Token);

        result.Error!.Code.ShouldBe(UserErrors.IdentityTakenErrorCode);
        result.Error.Type.ShouldBe(DomainErrorType.Conflict);
        _unitOfWork.Saves.ShouldBe(1);
    }

    [Fact]
    public async Task RegisterUser_Returns_TheUsersFailure()
    {
        var result = await RegisterHandler().HandleAsync(new RegisterUserCommand(Identity, "   "), Token);

        result.Error!.Code.ShouldBe(User.UserNameInvalidErrorCode);
        _users.Added.ShouldBeEmpty();
    }

    [Fact]
    public async Task AssignRole_Assigns_AndSaves()
    {
        var trader = _roles.Seed("Trader");
        var user = _users.Seed("trader");

        var result = await AssignHandler().HandleAsync(new AssignRoleCommand(user.Id.Value, trader.Id.Value), Token);

        result.IsSuccess.ShouldBeTrue();
        user.Holds(trader.Id).ShouldBeTrue();
        _unitOfWork.Saves.ShouldBe(1);
    }

    [Fact]
    public async Task AssignRole_Fails_ForAnUnknownUser()
    {
        var trader = _roles.Seed("Trader");

        var result = await AssignHandler().HandleAsync(
            new AssignRoleCommand(Guid.CreateVersion7(), trader.Id.Value),
            Token);

        result.Error!.Code.ShouldBe(UserErrors.NotFoundErrorCode);
        _unitOfWork.Saves.ShouldBe(0);
    }

    [Fact]
    public async Task AssignRole_Fails_ForAnUnknownRole()
    {
        var user = _users.Seed("trader");

        var result = await AssignHandler().HandleAsync(new AssignRoleCommand(user.Id.Value, Guid.CreateVersion7()), Token);

        result.Error!.Code.ShouldBe(RoleErrors.NotFoundErrorCode);
        result.Error.Type.ShouldBe(DomainErrorType.NotFound);
        _unitOfWork.Saves.ShouldBe(0);
    }

    [Fact]
    public async Task AssignRole_Returns_TheUsersConflict()
    {
        var trader = _roles.Seed("Trader");
        var user = _users.Seed("trader", trader);

        var result = await AssignHandler().HandleAsync(new AssignRoleCommand(user.Id.Value, trader.Id.Value), Token);

        result.Error!.Code.ShouldBe(User.AlreadyAssignedErrorCode);
        _unitOfWork.Saves.ShouldBe(0);
    }

    [Fact]
    public async Task UnassignRole_Unassigns_AndSaves()
    {
        var trader = _roles.Seed("Trader");
        var user = _users.Seed("trader", trader);

        var result = await UnassignHandler().HandleAsync(new UnassignRoleCommand(user.Id.Value, trader.Id.Value), Token);

        result.IsSuccess.ShouldBeTrue();
        user.RoleAssignments.ShouldBeEmpty();
        _unitOfWork.Saves.ShouldBe(1);
    }

    [Fact]
    public async Task UnassignRole_Returns_TheUsersConflict()
    {
        var trader = _roles.Seed("Trader");
        var user = _users.Seed("trader");

        var result = await UnassignHandler().HandleAsync(new UnassignRoleCommand(user.Id.Value, trader.Id.Value), Token);

        result.Error!.Code.ShouldBe(User.NotAssignedErrorCode);
        _unitOfWork.Saves.ShouldBe(0);
    }

    [Fact]
    public async Task ListUsers_Names_EachUsersRoles()
    {
        var trader = _roles.Seed("Trader");
        var operations = _roles.Seed("Operations");
        _users.Seed("zoe", operations);
        _users.Seed("adam", trader, operations);

        var result = await new ListUsersQueryHandler(_users, _roles).HandleAsync(new ListUsersQuery(), Token);

        result.Value.Select(user => user.UserName).ShouldBe(["adam", "zoe"]);
        result.Value[0].Roles.Select(role => role.Name).ShouldBe(["Trader", "Operations"]);
        result.Value[0].Roles[0].AssignedAt.ShouldBe(TestClock.Now);
    }

    [Fact]
    public async Task GetUser_Fails_ForAnUnknownUser()
    {
        var result = await new GetUserQueryHandler(_users, _roles).HandleAsync(new GetUserQuery(Guid.CreateVersion7()), Token);

        result.Error!.Code.ShouldBe(UserErrors.NotFoundErrorCode);
    }

    private RegisterUserCommandHandler RegisterHandler()
    {
        return new RegisterUserCommandHandler(_users, _unitOfWork, new NewGuidV7(), TestClock.Frozen);
    }

    private AssignRoleCommandHandler AssignHandler()
    {
        return new AssignRoleCommandHandler(_users, _roles, _unitOfWork, TestClock.Frozen);
    }

    private UnassignRoleCommandHandler UnassignHandler()
    {
        return new UnassignRoleCommandHandler(_users, _unitOfWork, TestClock.Frozen);
    }
}
