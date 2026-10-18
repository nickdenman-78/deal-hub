namespace Ets.Servers.Api.Authentication;

/// <summary>
///     Where tokens come from and who they must be for (ADR-0006).
/// </summary>
/// <remarks>
///     Locally the AppHost supplies <see cref="Authority" />; a deployed host gets it from its environment
///     (<c>Keycloak__Authority</c>). Absent or malformed values fail startup naming the key — there is no
///     unauthenticated fallback.
/// </remarks>
internal sealed class KeycloakOptions
{
    public const string SectionName = "Keycloak";

    /// <summary>The realm URL, which is also the token issuer, e.g. <c>http://localhost:8080/realms/ets</c>.</summary>
    public string? Authority { get; set; }

    /// <summary>
    ///     The audience every access token must carry: the API's own Keycloak client id. Keycloak's default
    ///     audience is <c>account</c> unless a mapper adds this one, so it is required, never defaulted to that.
    /// </summary>
    public string? Audience { get; set; }

    /// <summary>
    ///     The public PKCE client the Scalar reference UI signs in with, in Development. Optional: without it the
    ///     reference UI cannot sign in, and the API is unaffected.
    /// </summary>
    public string? ReferenceUiClientId { get; set; }

    /// <summary>Only the local Keycloak container serves plain HTTP; everything else must be HTTPS.</summary>
    public bool RequireHttpsMetadata { get; set; } = true;

    internal bool IsValid()
    {
        return Uri.TryCreate(Authority, UriKind.Absolute, out _) && !string.IsNullOrWhiteSpace(Audience);
    }
}
