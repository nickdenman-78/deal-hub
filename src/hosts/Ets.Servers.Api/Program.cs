using System.Globalization;
using System.Security.Claims;
using Ets.Aspire.ServiceDefaults;
using Ets.Core.Application;
using Ets.Core.Domain;
using Ets.Core.Infrastructure;
using Ets.Core.Infrastructure.Authorization;
using Ets.Core.Presentation.Middleware;
using Ets.Modules.Deals.Infrastructure;
using Ets.Modules.Deals.IntegrationEvents.Authorization;
using Ets.Modules.Deals.Presentation;
using Ets.Servers.Api.Authentication;
using Ets.Servers.Api.Logging;
using Ets.Servers.Api.OpenApi;
using Scalar.AspNetCore;
using Serilog;
using Serilog.Events;

var builder = WebApplication.CreateBuilder(args);

// ---- Host defaults ------------------------------------------------------------------------------------------

// Aspire first: OpenTelemetry, the health-check registry, service discovery and HTTP resilience. Serilog after
// it with writeToProviders, so the OpenTelemetry logging provider still sees every event (ADR-0007, ADR-0016).
builder.AddServiceDefaults();

builder.Host.UseSerilog(
    (context, loggerConfig) =>
    {
        loggerConfig
            .MinimumLevel.Information()
            .MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Warning)
            .Enrich.FromLogContext()
            .WriteTo.Console(formatProvider: CultureInfo.InvariantCulture);

        var seq = context.Configuration.GetSection(SeqOptions.SectionName).Get<SeqOptions>();

        if (!string.IsNullOrWhiteSpace(seq?.ServerUrl))
        {
            loggerConfig.WriteTo.Seq(seq.ServerUrl, apiKey: seq.ApiKey, formatProvider: CultureInfo.InvariantCulture);
        }
    },
    writeToProviders: true);

builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

// ---- OpenAPI ------------------------------------------------------------------------------------------------

// One document per module so generated clients follow the module boundary, plus one for the host's own
// routes. Each document takes only the routes carrying its own group name: the default predicate would also
// admit every route that declares no group, publishing it in every document at once.
const string hostOpenApiDocument = "host";

builder.Services.AddOpenApi(
    OpenApiDocuments.Deals,
    options =>
    {
        options.ShouldInclude = description => description.GroupName == OpenApiDocuments.Deals;
        options.OrderTags(OpenApiDocuments.DealsTagOrder);
        options.AddKeycloakOAuth2(builder.Configuration);
    });

builder.Services.AddOpenApi(
    hostOpenApiDocument,
    options =>
    {
        options.ShouldInclude = description => description.GroupName == hostOpenApiDocument;
        options.AddKeycloakOAuth2(builder.Configuration);
    });

builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy
    .WithOrigins(builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? [])
    .AllowAnyHeader()
    .AllowAnyMethod()
    .AllowCredentials()));

// ---- Identity and authorization (ADR-0006) ------------------------------------------------------------------

builder.Services.AddKeycloakAuthentication(builder.Configuration);

// One declared policy per permission, assembled from each module's published catalogue. No dynamic policy
// provider, and no switch that disables authorization.
builder.Services.AddCoreAuthorization(DealsPermissions.All);

// ---- Kernel -------------------------------------------------------------------------------------------------

// The clock (NEM market time) and the holiday calendar.
builder.Services.AddCoreApplication(builder.Configuration);

// The Guid v7 id generator and the request's caller, before the modules so their contexts can use them.
builder.Services.AddCoreInfrastructure();

// The one PostgreSQL data source (ConnectionStrings:ets), shared by the modules' Marten stores. Aspire adds its
// health check to /health and its traces and metrics to OpenTelemetry (ADR-0010, ADR-0016).
builder.AddNpgsqlDataSource("ets");

// ---- Modules: three lines each (ADR-0003) -------------------------------------------------------------------

builder.Services
    .AddDealsModule(builder.Configuration)
    .AddDealsEndpoints(new DealsAuthorizationPolicies(
        DealsPermissions.Read,
        DealsPermissions.Capture,
        DealsPermissions.Confirm));

// After every module: the CQRS decorators are open-generic and wrap whatever handlers are registered at this
// point, so registering them earlier would miss some and double-wrap others (ADR-0008).
builder.Services.AddMediatorPipeline();

var app = builder.Build();

// ---- Pipeline: exception handler → default endpoints → request logging → CORS → authN → authZ → routes ----

app.UseExceptionHandler();

app.MapDefaultEndpoints();

// After the exception handler so the request log records the status the client actually received.
app.UseSerilogRequestLogging();

// Before authentication: a CORS preflight carries no credentials and must not be challenged.
app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    // Scalar does not discover documents; every document registered above must be named here as well.
    app.MapScalarApiReference(options =>
    {
        options.AddDocument(OpenApiDocuments.Deals);
        options.AddDocument(hostOpenApiDocument);
        options.AddKeycloakSignIn(app.Configuration);
    });

    // The bare host is otherwise a 404. Development convenience only, and excluded from every document.
    app.MapGet("/", () => Results.Redirect("/scalar/")).AllowAnonymous().ExcludeFromDescription();
}

app.MapDealsModule();

// Who the caller is and what they may do. The SPA reads its permissions here, never by decoding a token
// (ADR-0006). UX only: nothing here grants anything — every endpoint enforces its own permission policy.
app.MapGet("/api/me", (ClaimsPrincipal user) => Results.Ok(new
    {
        identityId = user.FindFirstValue("sub"),
        name = user.Identity?.Name ?? string.Empty,
        email = user.FindFirstValue("email"),
        permissions = user.FindAll(PermissionClaimTypes.Permission)
            .Select(claim => claim.Value)
            .Distinct(StringComparer.Ordinal)
            .Order(StringComparer.Ordinal)
            .ToArray()
    }))
    .RequireAuthorization()
    .WithGroupName(hostOpenApiDocument);

await app.RunAsync().ConfigureAwait(false);

namespace Ets.Servers.Api
{
    /// <summary>
    ///     Public handle on this assembly for <c>WebApplicationFactory&lt;IApiMarker&gt;</c>. Avoids both
    ///     InternalsVisibleTo and the entry-point ambiguity <c>Program</c> causes in xUnit v3 test projects, which
    ///     generate their own entry point.
    /// </summary>
#pragma warning disable CA1515 // Must be public: integration test projects reference it from outside this assembly.
    public interface IApiMarker;
#pragma warning restore CA1515
}
