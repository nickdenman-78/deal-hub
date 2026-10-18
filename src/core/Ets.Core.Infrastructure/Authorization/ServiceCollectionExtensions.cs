using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;

namespace Ets.Core.Infrastructure.Authorization;

public static class ServiceCollectionExtensions
{
    /// <summary>
    ///     Registers one authorization policy per declared permission (ADR-0006).
    /// </summary>
    /// <param name="services">The <see cref="IServiceCollection" /> to add policies to.</param>
    /// <param name="permissions">
    ///     Every permission the composed modules declare. The host concatenates each module's
    ///     <c>{Module}Permissions.All</c>, so no module has to know about any other and the complete set is
    ///     still known at startup.
    /// </param>
    /// <returns>The same service collection for method chaining.</returns>
    /// <remarks>
    ///     <para>
    ///         Policies are declared, not synthesised on demand from whatever string an endpoint passes. A
    ///         dynamic policy provider makes the set unenumerable and turns a typo into a policy nobody holds —
    ///         or, with a careless provider, one everybody passes. Here an endpoint naming an undeclared
    ///         permission fails when the policy is first evaluated, and the declared set can be listed.
    ///     </para>
    ///     <para>
    ///         Each policy requires an authenticated caller carrying a <see cref="PermissionClaimTypes.Permission" />
    ///         claim with that exact value. Roles never appear in a policy: which roles grant which
    ///         permissions is data in the Users module, changeable without a deploy.
    ///     </para>
    /// </remarks>
    public static IServiceCollection AddCoreAuthorization(
        this IServiceCollection services,
        params IEnumerable<string> permissions)
    {
        ArgumentNullException.ThrowIfNull(permissions);

        string[] declared = [.. permissions.Distinct(StringComparer.Ordinal)];

        if (declared.Any(string.IsNullOrWhiteSpace))
        {
            throw new ArgumentException("A permission name cannot be empty.", nameof(permissions));
        }

        services.AddAuthorization(options =>
        {
            foreach (string permission in declared)
            {
                options.AddPolicy(
                    permission,
                    policy => policy
                        .AddAuthenticationSchemes(JwtBearerDefaults.AuthenticationScheme)
                        .RequireAuthenticatedUser()
                        .RequireClaim(PermissionClaimTypes.Permission, permission));
            }
        });

        return services;
    }
}
