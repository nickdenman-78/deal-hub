using Ets.Modules.Deals.Application;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Ets.Modules.Deals.Infrastructure;

/// <summary>
///     Service-side composition root for the Deals module.
/// </summary>
/// <remarks>
///     The route side lives in <c>Ets.Modules.Deals.Presentation.DealsEndpoints</c>. The two are deliberately
///     separate: Infrastructure must not reference Presentation, and Presentation must not reference
///     Infrastructure, so neither can host both halves (ADR-0003).
/// </remarks>
public static class DealsModule
{
    /// <summary>
    ///     Registers the Deals use cases and the adapters they depend on.
    /// </summary>
    /// <param name="services">The <see cref="IServiceCollection" /> to add services to.</param>
    /// <param name="configuration">
    ///     Host configuration. Each adapter binds its own named section (<c>SectionName</c>, ADR-0005).
    /// </param>
    /// <returns>The same service collection for method chaining.</returns>
    public static IServiceCollection AddDealsModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        services.AddDealsApplication();

        return services;
    }
}
