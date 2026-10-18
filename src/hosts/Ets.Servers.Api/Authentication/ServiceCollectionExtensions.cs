using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;

namespace Ets.Servers.Api.Authentication;

internal static class ServiceCollectionExtensions
{
    /// <summary>
    ///     Validates Keycloak-issued bearer tokens (ADR-0006).
    /// </summary>
    /// <remarks>
    ///     <para>
    ///         This host is a pure resource server: it validates a token and nothing else. It does not sign
    ///         users in and holds no secret. What a caller may do is decided by permission claims added from the
    ///         Users module — never by roles in the token.
    ///     </para>
    ///     <para>
    ///         Issuer and audience are validated explicitly. Keycloak's default audience is <c>account</c>; the
    ///         realm's clients carry an audience mapper that adds the API's client id, and this is where a token
    ///         without it is turned away.
    ///     </para>
    /// </remarks>
    public static IServiceCollection AddKeycloakAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        services.AddOptions<KeycloakOptions>()
            .Bind(configuration.GetSection(KeycloakOptions.SectionName))
            .Validate(
                static options => options.IsValid(),
                $"{KeycloakOptions.SectionName}:Authority must be an absolute URL and " +
                $"{KeycloakOptions.SectionName}:Audience must be set.")
            .ValidateOnStart();

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();

        // Configured from the validated options rather than read inline, so the bearer handler and the
        // OpenAPI description cannot disagree about the authority.
        services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
            .Configure<IOptions<KeycloakOptions>>(static (bearer, keycloakOptions) =>
            {
                var keycloak = keycloakOptions.Value;

                bearer.Authority = keycloak.Authority;
                bearer.Audience = keycloak.Audience;
                bearer.RequireHttpsMetadata = keycloak.RequireHttpsMetadata;
                bearer.MapInboundClaims = false;

                bearer.TokenValidationParameters.ValidateIssuer = true;
                bearer.TokenValidationParameters.ValidIssuer = keycloak.Authority;
                bearer.TokenValidationParameters.ValidateAudience = true;
                bearer.TokenValidationParameters.ValidAudience = keycloak.Audience;
                bearer.TokenValidationParameters.NameClaimType = "preferred_username";
            });

        return services;
    }
}
