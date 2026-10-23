using Microsoft.AspNetCore.Routing;

namespace Ets.Core.Presentation.Endpoints;

/// <summary>
///     A single route registration. One implementation per vertical slice.
/// </summary>
/// <remarks>
///     Implementations are resolved from the <em>root</em> service provider by
///     <see cref="EndpointExtensions.MapEndpoints" />, so they must not take scoped constructor
///     dependencies. Handlers and other per-request services are injected into the route delegate by
///     minimal-API parameter binding instead.
/// </remarks>
public interface IEndpoint
{
    void MapEndpoint(IEndpointRouteBuilder app);
}
