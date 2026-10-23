using Ets.Core.Application.Options;
using Ets.Core.Application.Services;
using Ets.Core.Domain.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace Ets.Core.Application;

public static class ServiceCollectionExtensions
{
    /// <param name="services">The service collection to add services to.</param>
    extension(IServiceCollection services)
    {
        /// <summary>
        ///     Registers the cross-module application services: the clock and the holiday calendar.
        /// </summary>
        /// <param name="configuration">The host configuration; the holiday calendar binds its own section.</param>
        /// <returns>The service collection with application services registered.</returns>
        [UsedImplicitly]
        public IServiceCollection AddCoreApplication(IConfiguration configuration)
        {
            // Lets tests resolve services without a full logging setup; a host's real logging wins.
            services.TryAddSingleton(typeof(ILogger<>), typeof(NullLogger<>));

            services.AddTimeService();
            services.AddHolidayService(configuration);

            return services;
        }

        /// <summary>
        ///     Registers <see cref="DateTimeProvider" /> as a singleton and <see cref="IDateTimeProvider" /> as a
        ///     scoped <see cref="FrozenDateTimeProvider" /> over it, so time is constant within a scope.
        /// </summary>
        private void AddTimeService()
        {
            services.TryAddSingleton<DateTimeProvider>();
            services.TryAddScoped<IDateTimeProvider>(provider =>
                new FrozenDateTimeProvider(provider.GetRequiredService<DateTimeProvider>()));
        }

        /// <summary>
        ///     Registers <see cref="HolidayCalendarService" /> as a singleton.
        /// </summary>
        /// <param name="configuration">The configuration holding <see cref="HolidayServiceOptions.SectionName" />.</param>
        private void AddHolidayService(IConfiguration configuration)
        {
            ArgumentNullException.ThrowIfNull(configuration);

            services.AddOptions<HolidayServiceOptions>()
                .Bind(configuration.GetSection(HolidayServiceOptions.SectionName))
                .Validate(
                    options => options.MaxCacheSize >= 0 &&
                               (options.CacheExpiration is null || options.CacheExpiration > TimeSpan.Zero),
                    $"{HolidayServiceOptions.SectionName}: MaxCacheSize must not be negative and CacheExpiration must be positive.")
                .ValidateOnStart();

            // Built explicitly around the singleton DateTimeProvider rather than the scoped
            // IDateTimeProvider. Two reasons, and the second is the important one:
            //  - a singleton consuming a scoped service is a captive dependency, and container
            //    validation rejects it outright;
            //  - the scoped registration is a FrozenDateTimeProvider, which pins time for the lifetime
            //    of its scope. This service uses the clock only to expire its cache, so capturing a
            //    frozen one would pin the cache to the startup instant and it would never expire.
            services.TryAddSingleton<IHolidayCalendarService>(provider => new HolidayCalendarService(
                provider.GetRequiredService<DateTimeProvider>(),
                provider.GetRequiredService<IOptions<HolidayServiceOptions>>(),
                provider.GetRequiredService<ILogger<HolidayCalendarService>>()));
        }
    }
}
