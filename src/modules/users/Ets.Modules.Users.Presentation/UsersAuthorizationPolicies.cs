namespace Ets.Modules.Users.Presentation;

/// <summary>
///     The authorization policy names this module's endpoints ask for, supplied by the host.
/// </summary>
/// <remarks>
///     Presentation never imports a permission constant: it receives policy names as strings, so which
///     permission guards each class of endpoint stays the host's call (ADR-0003). The host passes
///     <c>UsersPermissions.Read</c> and <c>.Manage</c>. Every name is required; there is no switch that
///     disables authorization (ADR-0006).
/// </remarks>
public sealed record UsersAuthorizationPolicies
{
    public UsersAuthorizationPolicies(string read, string manage)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(read);
        ArgumentException.ThrowIfNullOrWhiteSpace(manage);

        Read = read;
        Manage = manage;
    }

    /// <summary>Viewing users, roles and the permissions roles grant.</summary>
    public string Read { get; }

    /// <summary>Registering users, creating roles, and granting or assigning them.</summary>
    public string Manage { get; }
}
