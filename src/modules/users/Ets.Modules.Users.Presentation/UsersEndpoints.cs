using Ets.Core.Presentation.Endpoints;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;

namespace Ets.Modules.Users.Presentation;

/// <summary>
///     Route-side composition root for the Users module. Pairs with
///     <c>Ets.Modules.Users.Infrastructure.UsersModule</c> on the service side.
/// </summary>
public static class UsersEndpoints
{
    /// <summary>
    ///     Registers the module's <see cref="IEndpoint" /> implementations and the policy names they ask for.
    /// </summary>
    /// <param name="services">The <see cref="IServiceCollection" /> to add endpoints to.</param>
    /// <param name="policies">Policy names, supplied by the host.</param>
    /// <returns>The same service collection for method chaining.</returns>
    public static IServiceCollection AddUsersEndpoints(
        this IServiceCollection services,
        UsersAuthorizationPolicies policies)
    {
        ArgumentNullException.ThrowIfNull(policies);

        services.AddSingleton(policies);

        return services.AddEndpoints(AssemblyReference.Assembly);
    }

    /// <summary>
    ///     Maps the module's endpoints under its own route group.
    /// </summary>
    /// <param name="app">The route builder to map onto.</param>
    /// <returns>The same route builder for method chaining.</returns>
    /// <remarks>The group carries no authorization of its own; each endpoint states its own policy.</remarks>
    public static IEndpointRouteBuilder MapUsersModule(this IEndpointRouteBuilder app)
    {
        ArgumentNullException.ThrowIfNull(app);

        var group = app.MapGroup("/api/users");

        group.WithTags(Tags.Users);
        group.WithGroupName(OpenApiDocuments.Users);

        group.MapEndpoints(AssemblyReference.Assembly);

        return app;
    }
}
