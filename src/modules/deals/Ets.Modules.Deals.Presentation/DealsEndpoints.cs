using Ets.Core.Presentation.Endpoints;
using Ets.Modules.Deals.Application.Deals;
using Ets.Modules.Deals.Presentation.Realtime;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;

namespace Ets.Modules.Deals.Presentation;

/// <summary>
///     Route-side composition root for the Deals module. Pairs with
///     <c>Ets.Modules.Deals.Infrastructure.DealsModule</c> on the service side.
/// </summary>
public static class DealsEndpoints
{
    /// <summary>
    ///     Registers the module's <see cref="IEndpoint" /> implementations and the policy names they ask for.
    /// </summary>
    /// <param name="services">The <see cref="IServiceCollection" /> to add endpoints to.</param>
    /// <param name="policies">
    ///     Policy names, supplied by the host. Endpoints read these from the root provider when mapping,
    ///     which is why they are registered here rather than passed to <see cref="MapDealsModule" />.
    /// </param>
    /// <returns>The same service collection for method chaining.</returns>
    public static IServiceCollection AddDealsEndpoints(
        this IServiceCollection services,
        DealsAuthorizationPolicies policies)
    {
        ArgumentNullException.ThrowIfNull(policies);

        services.AddSingleton(policies);

        // Screens hear about deal changes over SignalR (WebSockets). The host adds SignalR itself.
        services.AddSingleton<IDealsChangedNotifier, SignalRDealsChangedNotifier>();

        return services.AddEndpoints(AssemblyReference.Assembly);
    }

    /// <summary>
    ///     Maps the module's endpoints under its own route group.
    /// </summary>
    /// <param name="app">The route builder to map onto.</param>
    /// <returns>The same route builder for method chaining.</returns>
    /// <remarks>
    ///     The group carries no authorization of its own. Each endpoint states its own policy, because a
    ///     group-level default is exactly the mechanism by which a new capture or confirm route silently
    ///     inherits read authorization.
    /// </remarks>
    public static IEndpointRouteBuilder MapDealsModule(this IEndpointRouteBuilder app)
    {
        ArgumentNullException.ThrowIfNull(app);

        // Prefix, tags and OpenAPI document are set once here so individual slices only declare the part of
        // the route that is theirs. Applied as statements rather than chained: the convention extensions are
        // generic over IEndpointConventionBuilder and would erase RouteGroupBuilder.
        var group = app.MapGroup("/api/deals");

        group.WithTags(Tags.Deals);
        group.WithGroupName(OpenApiDocuments.Deals);

        group.MapEndpoints(AssemblyReference.Assembly);

        // Mapped beside the group rather than in it, so the hub stays out of the OpenAPI document.
        app.MapHub<DealsHub>("/api/deals/hub")
            .RequirePolicy(app.Policies().Read)
            .ExcludeFromDescription();

        return app;
    }
}
