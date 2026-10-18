using System.Security.Claims;
using Ets.Core.Domain.Models;
using Microsoft.AspNetCore.Http;

namespace Ets.Core.Infrastructure.Identity;

/// <summary>
///     The signed-in caller, read from the current request's Keycloak token.
/// </summary>
/// <remarks>
///     <para>
///         Resolved per read rather than captured at construction, because it is registered scoped alongside
///         contexts that may outlive the point at which the principal is established.
///     </para>
///     <para>
///         Every property is <see langword="null" /> when there is no request or no authenticated user — a
///         Wolverine handler, a Quartz job, a design-time context. Audit columns then record the timestamp
///         and no user, which is the truth: nobody asked for that save.
///     </para>
/// </remarks>
public sealed class HttpContextUser(IHttpContextAccessor httpContextAccessor) : IContextUser
{
    /// <remarks>
    ///     Keycloak issues the subject as <c>sub</c>; inbound claim mapping may already have moved it to
    ///     <see cref="ClaimTypes.NameIdentifier" />.
    /// </remarks>
    public string? IdentityId => Claim("sub") ?? Claim(ClaimTypes.NameIdentifier);

    public string? Name => Claim("name") ?? Claim(ClaimTypes.Name) ?? Claim("preferred_username");

    /// <remarks>
    ///     Suppressed when it merely repeats <see cref="Name" />, which happens when a realm uses the email as
    ///     the username. Without this, an audited row reads <c>someone@example.com (someone@example.com)</c>.
    /// </remarks>
    public string? Email
    {
        get
        {
            string? email = Claim("email") ?? Claim(ClaimTypes.Email);

            return string.Equals(email, Name, StringComparison.OrdinalIgnoreCase) ? null : email;
        }
    }

    private string? Claim(string claimType)
    {
        string? value = httpContextAccessor.HttpContext?.User.FindFirstValue(claimType);

        return string.IsNullOrWhiteSpace(value) ? null : value;
    }
}
