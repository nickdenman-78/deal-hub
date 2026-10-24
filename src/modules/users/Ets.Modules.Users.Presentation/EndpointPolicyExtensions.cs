using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;

namespace Ets.Modules.Users.Presentation;

/// <summary>
///     Lets a slice name its policy as <c>.RequirePolicy(app.Policies().Manage)</c>.
/// </summary>
internal static class EndpointPolicyExtensions
{
    internal static UsersAuthorizationPolicies Policies(this IEndpointRouteBuilder app)
    {
        return app.ServiceProvider.GetRequiredService<UsersAuthorizationPolicies>();
    }

    internal static TBuilder RequirePolicy<TBuilder>(this TBuilder builder, string policy)
        where TBuilder : IEndpointConventionBuilder
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(policy);

        return builder.RequireAuthorization(policy);
    }
}
