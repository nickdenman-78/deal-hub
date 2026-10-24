using Ets.Core.Domain.Models;
using Ets.Modules.Users.Application.Roles;
using Ets.Modules.Users.Application.Roles.CreateRole;
using Ets.Modules.Users.Application.Roles.GetRole;
using Ets.Modules.Users.Application.Roles.GrantPermission;
using Ets.Modules.Users.Application.Roles.ListRoles;
using Ets.Modules.Users.Application.Roles.RevokePermission;
using Ets.Modules.Users.Domain.Events;
using Ets.Modules.Users.Domain.Models;
using Ets.Modules.Users.Domain.ValueObjects;

namespace EtsUsersTests.Application;

public sealed class RoleUseCaseTests
{
    private readonly FakeRoleRepository _roles = new();
    private readonly FakeUnitOfWork _unitOfWork = new();

    private static CancellationToken Token => TestContext.Current.CancellationToken;

    [Fact]
    public async Task CreateRole_Creates_AndSaves_TheRole()
    {
        var result = await CreateHandler().HandleAsync(
            new CreateRoleCommand(" Risk ", ["deals:read", "deals:read"]),
            Token);

        var role = _roles.Added.ShouldHaveSingleItem();
        result.Value.ShouldBe(role.Id.Value);
        role.Name.Value.ShouldBe("Risk");
        role.Permissions.Select(permission => permission.Value).ShouldBe(["deals:read"]);
        role.DomainEvents.ShouldHaveSingleItem().ShouldBeOfType<RoleCreated>();
        _unitOfWork.Saves.ShouldBe(1);
    }

    [Fact]
    public async Task CreateRole_Fails_ForAMalformedPermission()
    {
        var result = await CreateHandler().HandleAsync(new CreateRoleCommand("Risk", ["Deals.Read"]), Token);

        result.Error!.Code.ShouldBe(Permission.InvalidErrorCode);
        _roles.Added.ShouldBeEmpty();
        _unitOfWork.Saves.ShouldBe(0);
    }

    [Fact]
    public async Task CreateRole_Fails_WhenTheNameIsTaken()
    {
        _roles.Seed("Trader");

        var result = await CreateHandler().HandleAsync(new CreateRoleCommand("Trader", []), Token);

        result.Error!.Code.ShouldBe(RoleErrors.NameTakenErrorCode);
        result.Error.Type.ShouldBe(DomainErrorType.Conflict);
        _unitOfWork.Saves.ShouldBe(0);
    }

    [Fact]
    public async Task CreateRole_Returns_TheSaveFailure()
    {
        _unitOfWork.Outcome = Result.Failure(DomainError.Conflict("users.save-conflict", "Taken."));

        var result = await CreateHandler().HandleAsync(new CreateRoleCommand("Risk", []), Token);

        result.Error!.Code.ShouldBe("users.save-conflict");
    }

    [Fact]
    public void CreateRoleValidator_Rejects_AMissingNameOrPermissionList()
    {
        var validation = new CreateRoleCommandValidator().Validate(new CreateRoleCommand(string.Empty, null!));

        validation.Errors.Select(error => error.PropertyName)
            .ShouldBe([nameof(CreateRoleCommand.Name), nameof(CreateRoleCommand.Permissions)], ignoreOrder: true);
    }

    [Fact]
    public async Task GrantPermission_Grants_AndSaves()
    {
        var role = _roles.Seed("Trader", "deals:read");

        var result = await GrantHandler().HandleAsync(new GrantPermissionCommand(role.Id.Value, "deals:capture"), Token);

        result.IsSuccess.ShouldBeTrue();
        role.Permissions.Select(permission => permission.Value).ShouldBe(["deals:read", "deals:capture"]);
        _unitOfWork.Saves.ShouldBe(1);
    }

    [Fact]
    public async Task GrantPermission_Fails_ForAnUnknownRole()
    {
        var result = await GrantHandler().HandleAsync(new GrantPermissionCommand(Guid.CreateVersion7(), "deals:read"), Token);

        result.Error!.Code.ShouldBe(RoleErrors.NotFoundErrorCode);
        result.Error.Type.ShouldBe(DomainErrorType.NotFound);
        _unitOfWork.Saves.ShouldBe(0);
    }

    [Fact]
    public async Task GrantPermission_Returns_TheRolesConflict()
    {
        var role = _roles.Seed("Trader", "deals:read");

        var result = await GrantHandler().HandleAsync(new GrantPermissionCommand(role.Id.Value, "deals:read"), Token);

        result.Error!.Code.ShouldBe(Role.AlreadyGrantedErrorCode);
        _unitOfWork.Saves.ShouldBe(0);
    }

    [Fact]
    public async Task RevokePermission_Revokes_AndSaves()
    {
        var role = _roles.Seed("Trader", "deals:read", "deals:capture");

        var result = await RevokeHandler().HandleAsync(new RevokePermissionCommand(role.Id.Value, "deals:read"), Token);

        result.IsSuccess.ShouldBeTrue();
        role.Permissions.Select(permission => permission.Value).ShouldBe(["deals:capture"]);
        _unitOfWork.Saves.ShouldBe(1);
    }

    [Fact]
    public async Task RevokePermission_Returns_TheRolesConflict()
    {
        var role = _roles.Seed("Trader", "deals:read");

        var result = await RevokeHandler().HandleAsync(new RevokePermissionCommand(role.Id.Value, "deals:confirm"), Token);

        result.Error!.Code.ShouldBe(Role.NotGrantedErrorCode);
        _unitOfWork.Saves.ShouldBe(0);
    }

    [Fact]
    public async Task ListRoles_Returns_EveryRole_ByName()
    {
        _roles.Seed("Trader", "deals:read", "deals:capture");
        _roles.Seed("Administrator", "users:manage");

        var result = await new ListRolesQueryHandler(_roles).HandleAsync(new ListRolesQuery(), Token);

        result.Value.Select(role => role.Name).ShouldBe(["Administrator", "Trader"]);
        result.Value[1].Permissions.ShouldBe(["deals:read", "deals:capture"]);
    }

    [Fact]
    public async Task GetRole_Fails_ForAnUnknownRole()
    {
        var result = await new GetRoleQueryHandler(_roles).HandleAsync(new GetRoleQuery(Guid.CreateVersion7()), Token);

        result.Error!.Code.ShouldBe(RoleErrors.NotFoundErrorCode);
    }

    private CreateRoleCommandHandler CreateHandler()
    {
        return new CreateRoleCommandHandler(_roles, _unitOfWork, new NewGuidV7(), TestClock.Frozen);
    }

    private GrantPermissionCommandHandler GrantHandler()
    {
        return new GrantPermissionCommandHandler(_roles, _unitOfWork, TestClock.Frozen);
    }

    private RevokePermissionCommandHandler RevokeHandler()
    {
        return new RevokePermissionCommandHandler(_roles, _unitOfWork, TestClock.Frozen);
    }
}
