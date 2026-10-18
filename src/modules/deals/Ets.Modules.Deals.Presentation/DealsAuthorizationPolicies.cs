namespace Ets.Modules.Deals.Presentation;

/// <summary>
///     The authorization policy names this module's endpoints ask for, supplied by the host.
/// </summary>
/// <remarks>
///     <para>
///         Presentation never imports a permission constant — it receives policy names as strings, so which
///         permission guards each class of endpoint stays the host's call (ADR-0003). The host passes
///         <c>DealsPermissions.Read</c>, <c>.Capture</c> and <c>.Confirm</c>.
///     </para>
///     <para>
///         Every name is required. There is no switch that disables authorization (ADR-0006): tests run
///         against a real Keycloak container instead of booting anonymous.
///     </para>
/// </remarks>
public sealed record DealsAuthorizationPolicies
{
    public DealsAuthorizationPolicies(string read, string capture, string confirm)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(read);
        ArgumentException.ThrowIfNullOrWhiteSpace(capture);
        ArgumentException.ThrowIfNullOrWhiteSpace(confirm);

        Read = read;
        Capture = capture;
        Confirm = confirm;
    }

    /// <summary>Viewing deals.</summary>
    public string Read { get; }

    /// <summary>Capturing and amending deals.</summary>
    public string Capture { get; }

    /// <summary>Confirming deals with the counterparty.</summary>
    public string Confirm { get; }
}
