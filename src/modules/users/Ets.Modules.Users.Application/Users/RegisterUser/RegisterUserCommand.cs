using Ets.Core.Domain.CQRS;

namespace Ets.Modules.Users.Application.Users.RegisterUser;

/// <summary>
///     Registers a Keycloak identity as an ETS user, holding no roles yet. Returns the new user's id. The person
///     must already exist in Keycloak; registering does not create their sign-in.
/// </summary>
/// <param name="IdentityId">Their Keycloak subject: the <c>identityId</c> <c>GET /api/me</c> returns for them.</param>
/// <param name="UserName">The name they sign in with.</param>
public sealed record RegisterUserCommand(string IdentityId, string UserName) : ICommand<Guid>;
