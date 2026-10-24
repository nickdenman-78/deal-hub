namespace Ets.Modules.Users.Presentation.Users;

/// <summary>A Keycloak identity to register as an ETS user.</summary>
/// <param name="IdentityId">Their Keycloak subject: the <c>identityId</c> <c>GET /api/me</c> returns for them.</param>
/// <param name="UserName">The name they sign in with.</param>
internal sealed record RegisterUserRequest(string? IdentityId, string? UserName);
