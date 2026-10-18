using System.Reflection;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Ets.Core.Presentation.Endpoints;

public static class EndpointExtensions
{
    /// <summary>
    ///     Registers every <see cref="IEndpoint" /> implementation found in the supplied assemblies.
    ///     Each module calls this from its own <c>Add{Module}Module</c>, passing its presentation assembly.
    /// </summary>
    /// <param name="services">The <see cref="IServiceCollection" /> to add endpoints to.</param>
    /// <param name="assemblies">The assemblies to scan for <see cref="IEndpoint" /> implementations.</param>
    /// <returns>The same service collection for method chaining.</returns>
    public static IServiceCollection AddEndpoints(this IServiceCollection services, params Assembly[] assemblies)
    {
        var serviceDescriptors = assemblies
            .SelectMany(a => a.GetTypes())
            .Where(type => type is {IsAbstract: false, IsInterface: false} &&
                           type.IsAssignableTo(typeof(IEndpoint)))
            .Select(type => ServiceDescriptor.Transient(typeof(IEndpoint), type))
            .ToArray();

        services.TryAddEnumerable(serviceDescriptors);

        return services;
    }

    /// <summary>
    ///     Maps the <see cref="IEndpoint" /> implementations registered via <see cref="AddEndpoints" />.
    /// </summary>
    /// <param name="builder">
    ///     The route builder to map onto. Pass a <see cref="RouteGroupBuilder" /> to give the endpoints a
    ///     shared prefix, tag set, OpenAPI document and authorization policy.
    /// </param>
    /// <param name="fromAssembly">
    ///     When supplied, only endpoints declared in this assembly are mapped. Modules use this so each can
    ///     own its own route group rather than every endpoint landing in whichever group is mapped first.
    /// </param>
    /// <returns>The same route builder for method chaining.</returns>
    public static IEndpointRouteBuilder MapEndpoints(
        this IEndpointRouteBuilder builder,
        Assembly? fromAssembly = null)
    {
        // This is the root provider — see the remarks on IEndpoint for why implementations must not
        // take scoped constructor dependencies.
        var endpoints = builder.ServiceProvider.GetRequiredService<IEnumerable<IEndpoint>>();

        foreach (var endpoint in endpoints)
        {
            if (fromAssembly is not null && endpoint.GetType().Assembly != fromAssembly)
            {
                continue;
            }

            endpoint.MapEndpoint(builder);
        }

        return builder;
    }
}
