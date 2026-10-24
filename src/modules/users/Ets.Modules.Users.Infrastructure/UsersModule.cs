using Ets.Modules.Users.Application;
using Ets.Modules.Users.Domain.Repositories;
using Ets.Modules.Users.Infrastructure.Authorization;
using Ets.Modules.Users.Infrastructure.Persistence;
using Ets.Modules.Users.Infrastructure.Persistence.Repositories;
using Ets.Modules.Users.Infrastructure.Seeding;
using Ets.Modules.Users.IntegrationEvents.Authorization;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Ets.Modules.Users.Infrastructure;

/// <summary>
///     Service-side composition root for the Users module.
/// </summary>
/// <remarks>
///     The route side lives in <c>Ets.Modules.Users.Presentation.UsersEndpoints</c>; the host composes both
///     (ADR-0003).
/// </remarks>
public static class UsersModule
{
    /// <summary>
    ///     Registers the Users use cases, the store of users and roles, the user permissions query and the
    ///     claims transformation that turns a caller's roles into <c>permission</c> claims (ADR-0006).
    /// </summary>
    /// <param name="services">The <see cref="IServiceCollection" /> to add services to.</param>
    /// <param name="configuration">
    ///     Host configuration. Each adapter binds its own named section (<c>SectionName</c>, ADR-0005).
    /// </param>
    /// <returns>The same service collection for method chaining.</returns>
    /// <remarks>
    ///     The claims transformation replaces ASP.NET Core's no-op one, whichever of authentication and this
    ///     module registers first.
    /// </remarks>
    public static IServiceCollection AddUsersModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        services.AddUsersApplication();

        string? connectionString = configuration.GetConnectionString(UsersDbContext.ConnectionStringName);
        services.AddDbContext<UsersDbContext>(options => UsersDbContext.Configure(options, connectionString));

        services.AddScoped<IRoleRepository, RoleRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IUsersUnitOfWork, UsersUnitOfWork>();

        services.AddScoped<IUserPermissionsQuery, UserPermissionsQuery>();
        services.Replace(ServiceDescriptor.Scoped<IClaimsTransformation, PermissionClaimsTransformation>());

        services.AddOptions<UsersDevelopmentSeedOptions>()
            .Bind(configuration.GetSection(UsersDevelopmentSeedOptions.SectionName))
            .Validate(
                seed => seed.IsValid(),
                $"{UsersDevelopmentSeedOptions.SectionName}: every role needs a name, every user an identity id, " +
                "and a user may hold only roles the seed declares.")
            .ValidateOnStart();
        services.AddHostedService<UsersDevelopmentSeeder>();

        return services;
    }
}
