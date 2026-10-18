namespace Ets.Core.Infrastructure.Authorization;

/// <summary>
///     Claim types ETS adds to a caller's principal.
/// </summary>
public static class PermissionClaimTypes
{
    /// <summary>
    ///     One claim per permission the caller holds (<c>deals:confirm</c>), added by the claims
    ///     transformation from the Users module's role assignments — never read from the Keycloak token.
    /// </summary>
    public const string Permission = "permission";
}
