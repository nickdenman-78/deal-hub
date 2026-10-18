using Ets.Servers.Api.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;
using Scalar.AspNetCore;

namespace Ets.Servers.Api.OpenApi;

/// <summary>
///     Describes this host's Keycloak bearer authentication to the OpenAPI documents, and points the reference UI
///     at it so a request can be made as a signed-in user.
/// </summary>
/// <remarks>
///     The scheme repeats what <c>AddKeycloakAuthentication</c> accepts; the UI performs an authorization-code +
///     PKCE sign-in as a public client. No secret is involved.
/// </remarks>
internal static class KeycloakSecurity
{
    /// <summary>
    ///     The security scheme's name in the document. The reference UI's flow configuration is matched to the
    ///     document's scheme by this name and silently does nothing when the two disagree.
    /// </summary>
    internal const string SchemeName = "keycloak";

    private const string Scope = "openid";

    /// <summary>Declares the scheme on the document and requires it on the operations that challenge.</summary>
    internal static OpenApiOptions AddKeycloakOAuth2(this OpenApiOptions options, IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(options);
        ArgumentNullException.ThrowIfNull(configuration);

        if (Authority(configuration) is not { } authority)
        {
            return options;
        }

        options.AddDocumentTransformer((document, _, _) =>
        {
            document.Components ??= new OpenApiComponents();
            document.Components.SecuritySchemes ??=
                new Dictionary<string, IOpenApiSecurityScheme>(StringComparer.Ordinal);

            document.Components.SecuritySchemes[SchemeName] = new OpenApiSecurityScheme
            {
                Type = SecuritySchemeType.OAuth2,
                Description = "Keycloak. Authorization code with PKCE.",
                Flows = new OpenApiOAuthFlows
                {
                    AuthorizationCode = new OpenApiOAuthFlow
                    {
                        AuthorizationUrl = new Uri($"{authority}/protocol/openid-connect/auth"),
                        TokenUrl = new Uri($"{authority}/protocol/openid-connect/token"),
                        Scopes = new Dictionary<string, string>(StringComparer.Ordinal)
                        {
                            [Scope] = "Sign in to call the ETS API as yourself."
                        }
                    }
                }
            };

            return Task.CompletedTask;
        });

        options.AddOperationTransformer((operation, context, _) =>
        {
            var metadata = context.Description.ActionDescriptor.EndpointMetadata;

            // Only what actually challenges: an anonymous route marked secured would be withheld by the UI.
            if (metadata.OfType<IAllowAnonymous>().Any() || !metadata.OfType<IAuthorizeData>().Any())
            {
                return Task.CompletedTask;
            }

            operation.Security ??= [];

            // The reference must be given its document; without one it serialises as an empty requirement,
            // which the UI reads as "no sign-in needed here".
            operation.Security.Add(new OpenApiSecurityRequirement
            {
                [new OpenApiSecuritySchemeReference(SchemeName, context.Document)] = [Scope]
            });

            return Task.CompletedTask;
        });

        return options;
    }

    /// <summary>Gives the reference UI the public client and flow it needs to complete the sign-in.</summary>
    internal static ScalarOptions AddKeycloakSignIn(this ScalarOptions options, IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(options);
        ArgumentNullException.ThrowIfNull(configuration);

        string? clientId = configuration[$"{KeycloakOptions.SectionName}:{nameof(KeycloakOptions.ReferenceUiClientId)}"];

        if (Authority(configuration) is null || string.IsNullOrWhiteSpace(clientId))
        {
            return options;
        }

        options.AddAuthorizationCodeFlow(SchemeName, flow =>
        {
            flow.ClientId = clientId;
            flow.Pkce = Pkce.Sha256;
            flow.SelectedScopes = [Scope];
        });

        return options.AddPreferredSecuritySchemes(SchemeName);
    }

    private static string? Authority(IConfiguration configuration)
    {
        string? authority = configuration[$"{KeycloakOptions.SectionName}:{nameof(KeycloakOptions.Authority)}"];

        return Uri.TryCreate(authority, UriKind.Absolute, out _) ? authority!.TrimEnd('/') : null;
    }
}
