using Ets.Core.Domain.CQRS;

namespace Ets.Modules.Users.Application.Users.UnassignRole;

/// <summary>Takes the role <paramref name="RoleId" /> away from the user <paramref name="UserId" />.</summary>
/// <param name="UserId">The user's id.</param>
/// <param name="RoleId">The role's id.</param>
public sealed record UnassignRoleCommand(Guid UserId, Guid RoleId) : ICommand;
