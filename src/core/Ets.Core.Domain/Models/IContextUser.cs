namespace Ets.Core.Domain.Models;

/// <summary>
///     The caller a change is made on behalf of.
/// </summary>
/// <remarks>
///     Every member is <see langword="null" /> when there is no authenticated caller (a scheduled job, a
///     message handler, a design-time context). Events and audit records store <see cref="IdentityId" />,
///     not the name, because events are immutable and personal data in them must be minimal (ADR-0013).
/// </remarks>
public interface IContextUser
{
    /// <summary>The Keycloak subject (<c>sub</c>) — the user's identity id.</summary>
    string? IdentityId { get; }

    string? Name { get; }

    string? Email { get; }
}
