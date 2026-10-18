using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using OpenTelemetry;
using OpenTelemetry.Metrics;
using OpenTelemetry.Trace;

namespace Ets.Aspire.ServiceDefaults;

/// <summary>
///     Host defaults shared by every <c>Ets.Servers.*</c> host: OpenTelemetry, health checks, service discovery
///     and standard HTTP resilience (ADR-0007, ADR-0016).
/// </summary>
/// <remarks>
///     Works the same with or without the AppHost: telemetry is exported over OTLP only when
///     <c>OTEL_EXPORTER_OTLP_ENDPOINT</c> is set, which the AppHost does locally (Aspire dashboard) and a
///     deployment does to point at Seq.
/// </remarks>
public static class ServiceDefaultsExtensions
{
    /// <summary>Tag for health checks that belong in liveness. Everything else is readiness only.</summary>
    public const string LiveTag = "live";

    private const string AlivenessEndpointPath = "/alive";

    private const string HealthCheckPolicyName = "HealthChecks";

    private const string HealthEndpointPath = "/health";

    public static TBuilder AddServiceDefaults<TBuilder>(this TBuilder builder)
        where TBuilder : IHostApplicationBuilder
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.ConfigureOpenTelemetry();
        builder.AddDefaultHealthChecks();

        builder.Services.AddServiceDiscovery();

        builder.Services.ConfigureHttpClientDefaults(http =>
        {
            http.AddStandardResilienceHandler();
            http.AddServiceDiscovery();
        });

        return builder;
    }

    public static TBuilder AddDefaultHealthChecks<TBuilder>(this TBuilder builder)
        where TBuilder : IHostApplicationBuilder
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.Services.AddRequestTimeouts(static timeouts =>
            timeouts.AddPolicy(HealthCheckPolicyName, TimeSpan.FromSeconds(5)));

        builder.Services.AddOutputCache(static caching =>
            caching.AddPolicy(HealthCheckPolicyName, static policy => policy.Expire(TimeSpan.FromSeconds(10))));

        // The only liveness check. Dependencies (PostgreSQL, Redis, RabbitMQ, Keycloak) register readiness
        // checks without the live tag: an outage must take the instance out of rotation, not restart it.
        builder.Services.AddHealthChecks()
            .AddCheck("self", static () => HealthCheckResult.Healthy(), [LiveTag]);

        return builder;
    }

    public static TBuilder ConfigureOpenTelemetry<TBuilder>(this TBuilder builder)
        where TBuilder : IHostApplicationBuilder
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.Logging.AddOpenTelemetry(logging =>
        {
            logging.IncludeFormattedMessage = true;
            logging.IncludeScopes = true;
        });

        builder.Services.AddOpenTelemetry()
            .WithMetrics(metrics => metrics
                .AddAspNetCoreInstrumentation()
                .AddHttpClientInstrumentation()
                .AddRuntimeInstrumentation())
            .WithTracing(tracing => tracing
                .AddSource(builder.Environment.ApplicationName)
                .AddAspNetCoreInstrumentation(options =>
                    // Probes fire constantly and would drown out real traffic.
                    options.Filter = static context =>
                        !context.Request.Path.StartsWithSegments(
                            HealthEndpointPath,
                            StringComparison.OrdinalIgnoreCase) &&
                        !context.Request.Path.StartsWithSegments(
                            AlivenessEndpointPath,
                            StringComparison.OrdinalIgnoreCase))
                .AddHttpClientInstrumentation());

        builder.AddOpenTelemetryExporters();

        return builder;
    }

    /// <summary>
    ///     Maps the liveness and readiness probes. Both are anonymous — an orchestrator cannot present a bearer
    ///     token.
    /// </summary>
    public static IEndpointRouteBuilder MapDefaultEndpoints(this IEndpointRouteBuilder endpoints)
    {
        ArgumentNullException.ThrowIfNull(endpoints);

        // Ready: every check must pass before this instance takes traffic.
        endpoints.MapHealthChecks(HealthEndpointPath)
            .AllowAnonymous()
            .CacheOutput(HealthCheckPolicyName)
            .WithRequestTimeout(HealthCheckPolicyName);

        // Live: only the live-tagged checks. A failing dependency must not get the process restarted.
        endpoints.MapHealthChecks(
                AlivenessEndpointPath,
                new HealthCheckOptions {Predicate = static registration => registration.Tags.Contains(LiveTag)})
            .AllowAnonymous()
            .CacheOutput(HealthCheckPolicyName)
            .WithRequestTimeout(HealthCheckPolicyName);

        return endpoints;
    }

    private static TBuilder AddOpenTelemetryExporters<TBuilder>(this TBuilder builder)
        where TBuilder : IHostApplicationBuilder
    {
        bool useOtlpExporter = !string.IsNullOrWhiteSpace(builder.Configuration["OTEL_EXPORTER_OTLP_ENDPOINT"]);

        if (useOtlpExporter)
        {
            builder.Services.AddOpenTelemetry().UseOtlpExporter();
        }

        return builder;
    }
}
