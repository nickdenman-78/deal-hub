using System.Reflection;
using Ets.Core.Domain.CQRS;
using Ets.Core.Domain.Decorators;

namespace Ets.Core.Domain;

public static partial class ServiceCollectionExtensions
{
    /// <summary>
    ///     Registers the CQRS handlers found in <paramref name="assemblies" />. Each module calls this from
    ///     its own <c>Add{Module}Application</c>.
    /// </summary>
    /// <param name="services">The <see cref="IServiceCollection" /> to add services to.</param>
    /// <param name="assemblies">The assemblies to scan for handlers.</param>
    /// <returns>The same service collection for method chaining.</returns>
    /// <remarks>
    ///     This registers handlers only. Validation and logging come from
    ///     <see cref="AddMediatorPipeline" />, which the host calls once after every module has registered.
    /// </remarks>
    [UsedImplicitly]
    public static IServiceCollection AddMediator(this IServiceCollection services, params Assembly[] assemblies)
    {
        services.Scan(scan => scan.FromAssemblies(assemblies)
            .AddClasses(classes => classes.AssignableTo(typeof(IQueryHandler<,>)), false)
            .AsImplementedInterfaces()
            .WithScopedLifetime()
            .AddClasses(classes => classes.AssignableTo(typeof(ICommandHandler<>)), false)
            .AsImplementedInterfaces()
            .WithScopedLifetime()
            .AddClasses(classes => classes.AssignableTo(typeof(ICommandHandler<,>)), false)
            .AsImplementedInterfaces()
            .WithScopedLifetime());

        return services;
    }

    /// <summary>
    ///     Wraps every registered handler in the validation and logging decorators.
    /// </summary>
    /// <param name="services">The <see cref="IServiceCollection" /> to decorate.</param>
    /// <returns>The same service collection for method chaining.</returns>
    /// <remarks>
    ///     <para>
    ///         Call this exactly once, from the host, <em>after</em> every module has called
    ///         <see cref="AddMediator" />. The decorators are open-generic and apply to whatever is in the
    ///         container at the moment they are registered, so calling it per module would both miss
    ///         handlers registered later and re-wrap the ones registered earlier.
    ///     </para>
    ///     <para>
    ///         Uses TryDecorate rather than Decorate: a solution may legitimately have no queries, or no
    ///         commands without a response, and Decorate throws when nothing matches the open generic.
    ///     </para>
    /// </remarks>
    [UsedImplicitly]
    public static IServiceCollection AddMediatorPipeline(this IServiceCollection services)
    {
        // Scrutor applies decorators innermost-first, so validation is registered before logging:
        // logging ends up outermost and therefore also records validation failures.
        services.TryDecorate(typeof(ICommandHandler<>), typeof(ValidationDecorator.CommandBaseHandler<>));
        services.TryDecorate(typeof(ICommandHandler<,>), typeof(ValidationDecorator.CommandHandler<,>));

        services.TryDecorate(typeof(ICommandHandler<>), typeof(LoggingDecorator.CommandBaseHandler<>));
        services.TryDecorate(typeof(ICommandHandler<,>), typeof(LoggingDecorator.CommandHandler<,>));
        services.TryDecorate(typeof(IQueryHandler<,>), typeof(LoggingDecorator.QueryHandler<,>));

        return services;
    }
}
