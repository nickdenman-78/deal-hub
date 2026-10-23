namespace Ets.Modules.Deals.IntegrationEvents.Authorization;

/// <summary>
///     The permissions governing the Deals module (ADR-0006). Each value is both a permission the Users
///     module can grant to a role and the authorization policy name the module's endpoints ask for.
/// </summary>
/// <remarks>
///     <para>
///         Lives in IntegrationEvents because that project is the module's public API — the one thing the host
///         and other modules may reference. Which permissions a module defines is part of its contract; how it
///         enforces them is not.
///     </para>
///     <para>
///         Capture and confirm are separate because they are separate duties: the trader who captures a deal
///         must not be the person who confirms it with the counterparty. Which roles hold which permission is
///         data in the Users module, not code.
///     </para>
/// </remarks>
public static class DealsPermissions
{
    public const string Read = "deals:read";

    public const string Capture = "deals:capture";

    public const string Confirm = "deals:confirm";

    /// <summary>Every permission this module declares. The host builds its policy catalogue from these.</summary>
    public static IReadOnlyList<string> All { get; } = [Read, Capture, Confirm];
}
