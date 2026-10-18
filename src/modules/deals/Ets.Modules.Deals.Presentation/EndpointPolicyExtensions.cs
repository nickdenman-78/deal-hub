using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;

namespace Ets.Modules.Deals.Presentation;

/// <summary>
///     Lets a slice name its policy as <c>.RequirePolicy(app.Policies().Confirm)</c>.
/// </summary>
internal static class EndpointPolicyExtensions
{
    internal static DealsAuthorizationPolicies Policies(this IEndpointRouteBuilder app)
    {
        return app.ServiceProvider.GetRequiredService<DealsAuthorizationPolicies>();
    }

    internal static TBuilder RequirePolicy<TBuilder>(this TBuilder builder, string policy)
        where TBuilder : IEndpointConventionBuilder
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(policy);

        return builder.RequireAuthorization(policy);
    }
}
