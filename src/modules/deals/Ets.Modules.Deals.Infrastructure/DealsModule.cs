using Ets.Modules.Deals.Application;
using Ets.Modules.Deals.Domain.Repositories;
using Ets.Modules.Deals.Domain.Services;
using Ets.Modules.Deals.Infrastructure.EventStore;
using Ets.Modules.Deals.Infrastructure.Persistence;
using Ets.Modules.Deals.Infrastructure.Products;
using Marten;
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
    /// <remarks>
    ///     The event store runs on the host's shared <c>NpgsqlDataSource</c>, which the host registers with
    ///     Aspire's <c>AddNpgsqlDataSource</c>.
    /// </remarks>
    public static IServiceCollection AddDealsModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        services.AddDealsApplication();

        string? connectionString = configuration.GetConnectionString(DealsDbContext.ConnectionStringName);
        services.AddDbContext<DealsDbContext>(options => DealsDbContext.Configure(options, connectionString));

        services.AddScoped<IAsxProductCatalogue, AsxProductCatalogue>();

        services.AddMartenStore<IDealsStore>(DealsEventStore.Configure);
        services.AddScoped<DealsEventSession>();
        services.AddScoped<IExchangeDealRepository, ExchangeDealRepository>();
        services.AddScoped<IDealsUnitOfWork, DealsUnitOfWork>();

        return services;
    }
}
