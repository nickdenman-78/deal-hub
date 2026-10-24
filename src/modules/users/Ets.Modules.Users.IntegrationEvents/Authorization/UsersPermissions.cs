namespace Ets.Modules.Users.IntegrationEvents.Authorization;

/// <summary>
///     The permissions governing the Users module (ADR-0006). Each value is both a permission a role can grant
///     and the authorization policy name the module's endpoints ask for.
/// </summary>
/// <remarks>
///     Reading who holds which roles is separate from changing it, so access can be reviewed by people who
///     cannot grant it.
/// </remarks>
public static class UsersPermissions
{
    public const string Read = "users:read";

    public const string Manage = "users:manage";

    /// <summary>Every permission this module declares. The host builds its policy catalogue from these.</summary>
    public static IReadOnlyList<string> All { get; } = [Read, Manage];
}
