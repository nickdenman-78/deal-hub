using System.Security.Claims;
using Ets.Core.Infrastructure.Authorization;
using Ets.Modules.Users.IntegrationEvents.Authorization;
using Microsoft.AspNetCore.Authentication;

namespace Ets.Modules.Users.Infrastructure.Authorization;

/// <summary>
///     Adds a <c>permission</c> claim for every permission the caller's roles grant (ADR-0006). Keycloak says
///     who the caller is; this says what they may do.
/// </summary>
/// <remarks>
///     <para>
///         The permissions go on a separate identity marked <see cref="AuthenticationType" />, so the principal
///         is enriched once however often authentication runs in a request. A caller with no registered user
///         gets no permissions, and every permission policy denies them.
///     </para>
///     <para>
///         ASP.NET Core gives a claims transformation no cancellation token, so the query runs to completion.
///     </para>
/// </remarks>
[UsedImplicitly]
internal sealed class PermissionClaimsTransformation(IUserPermissionsQuery permissions) : IClaimsTransformation
{
    /// <summary>The authentication type of the identity carrying the permission claims.</summary>
    public const string AuthenticationType = "ets-permissions";

    private const string SubjectClaimType = "sub";

    public async Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
    {
        ArgumentNullException.ThrowIfNull(principal);

        if (principal.Identity?.IsAuthenticated != true ||
            principal.Identities.Any(identity => identity.AuthenticationType == AuthenticationType))
        {
            return principal;
        }

        string? subject = principal.FindFirst(SubjectClaimType)?.Value;

        if (string.IsNullOrWhiteSpace(subject))
        {
            return principal;
        }

        var granted = await permissions.GetPermissionsAsync(subject, CancellationToken.None).ConfigureAwait(false);

        var enriched = principal.Clone();
        enriched.AddIdentity(new ClaimsIdentity(
            granted.Select(permission => new Claim(PermissionClaimTypes.Permission, permission)),
            AuthenticationType));

        return enriched;
    }
}
