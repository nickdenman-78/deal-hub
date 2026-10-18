using Ets.Core.Domain.Models;
using Ets.Core.Domain.Services;
using Ets.Core.Infrastructure.Identity;
using Ets.Core.Infrastructure.Persistence;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Ets.Core.Infrastructure;

public static class ServiceCollectionExtensions
{
    /// <summary>
    ///     Registers the cross-module infrastructure every module relies on: the Guid v7 id generator and the
    ///     request's caller.
    /// </summary>
    /// <param name="services">The <see cref="IServiceCollection" /> to add services to.</param>
    /// <returns>The same service collection for method chaining.</returns>
    /// <remarks>
    ///     <see cref="IContextUser" /> is scoped, to match the request it reads from and the
    ///     <see cref="DbContextBase" /> that stamps it onto <see cref="IAudited" /> entities. The host calls
    ///     this once; modules do not.
    /// </remarks>
    public static IServiceCollection AddCoreInfrastructure(this IServiceCollection services)
    {
        services.AddHttpContextAccessor();
        services.TryAddScoped<IContextUser, HttpContextUser>();
        services.TryAddSingleton<IIdGenerator, GuidV7IdGenerator>();

        return services;
    }
}
