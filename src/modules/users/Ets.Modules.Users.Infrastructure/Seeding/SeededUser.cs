namespace Ets.Modules.Users.Infrastructure.Seeding;

/// <summary>A user in <see cref="UsersDevelopmentSeedOptions" /> and the seeded roles they hold.</summary>
internal sealed class SeededUser
{
    /// <summary>The user's Keycloak subject: the <c>identityId</c> <c>GET /api/me</c> returns once signed in.</summary>
    public string IdentityId { get; set; } = string.Empty;

    public string UserName { get; set; } = string.Empty;

    /// <summary>Names of roles in <see cref="UsersDevelopmentSeedOptions.Roles" />.</summary>
    public IList<string> Roles { get; } = [];
}
