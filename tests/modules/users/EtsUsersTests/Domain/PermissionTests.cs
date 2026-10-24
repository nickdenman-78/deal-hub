using Ets.Modules.Users.Domain.ValueObjects;

namespace EtsUsersTests.Domain;

public sealed class PermissionTests
{
    [Theory]
    [InlineData("deals:capture")]
    [InlineData("users:manage")]
    [InlineData("risk:override-limit")]
    public void Create_Accepts_ModuleColonAction(string value)
    {
        Permission.Create(value).Value.Value.ShouldBe(value);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("deals")]
    [InlineData("Deals:Capture")]
    [InlineData("deals:capture ")]
    [InlineData("deals:capture:all")]
    public void Create_Fails_ForAnythingElse(string? value)
    {
        Permission.Create(value).Error!.Code.ShouldBe(Permission.InvalidErrorCode);
    }
}
