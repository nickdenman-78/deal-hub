using Ets.Core.Domain;
using FluentValidation;

namespace Ets.Modules.Deals.Application;

public static class ServiceCollectionExtensions
{
    /// <summary>
    ///     Registers the Deals use cases: command and query handlers and their validators.
    /// </summary>
    /// <param name="services">The <see cref="IServiceCollection" /> to add services to.</param>
    /// <returns>The same service collection for method chaining.</returns>
    /// <remarks>
    ///     Handlers only. The validation and logging decorators are applied once by the host, after every
    ///     module has registered (<c>AddMediatorPipeline</c>, ADR-0008).
    /// </remarks>
    [UsedImplicitly]
    public static IServiceCollection AddDealsApplication(this IServiceCollection services)
    {
        var assembly = AssemblyReference.Assembly;

        services.AddMediator(assembly);
        services.AddValidatorsFromAssembly(assembly, includeInternalTypes: true);

        return services;
    }
}
