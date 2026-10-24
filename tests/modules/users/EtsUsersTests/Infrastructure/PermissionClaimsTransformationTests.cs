using System.Security.Claims;
using Ets.Core.Infrastructure.Authorization;
using Ets.Modules.Users.Infrastructure.Authorization;
using Ets.Modules.Users.IntegrationEvents.Authorization;

namespace EtsUsersTests.Infrastructure;

public sealed class PermissionClaimsTransformationTests
{
    private readonly FakePermissions _permissions = new();

    [Fact]
    public async Task Transform_Adds_APermissionClaimPerGrantedPermission()
    {
        var principal = await Transformation().TransformAsync(SignedIn("subject-1"));

        principal.FindAll(PermissionClaimTypes.Permission).Select(claim => claim.Value)
            .ShouldBe(["deals:capture", "deals:read"]);
        _permissions.Asked.ShouldBe(["subject-1"]);
    }

    [Fact]
    public async Task Transform_Runs_OncePerPrincipal()
    {
        var transformation = Transformation();
        var once = await transformation.TransformAsync(SignedIn("subject-1"));

        var twice = await transformation.TransformAsync(once);

        twice.FindAll(PermissionClaimTypes.Permission).Count().ShouldBe(2);
        _permissions.Asked.Count.ShouldBe(1);
    }

    [Fact]
    public async Task Transform_Leaves_AnAnonymousCallerAlone()
    {
        var anonymous = new ClaimsPrincipal(new ClaimsIdentity());

        var principal = await Transformation().TransformAsync(anonymous);

        principal.ShouldBeSameAs(anonymous);
        _permissions.Asked.ShouldBeEmpty();
    }

    private static ClaimsPrincipal SignedIn(string subject)
    {
        return new ClaimsPrincipal(new ClaimsIdentity([new Claim("sub", subject)], "Bearer"));
    }

    private PermissionClaimsTransformation Transformation()
    {
        return new PermissionClaimsTransformation(_permissions);
    }

    private sealed class FakePermissions : IUserPermissionsQuery
    {
        public List<string> Asked { get; } = [];

        public Task<IReadOnlyList<string>> GetPermissionsAsync(string identityId, CancellationToken cancellationToken)
        {
            Asked.Add(identityId);

            return Task.FromResult<IReadOnlyList<string>>(["deals:capture", "deals:read"]);
        }
    }
}
