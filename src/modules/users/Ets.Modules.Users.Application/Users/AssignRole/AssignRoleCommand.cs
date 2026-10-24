using Ets.Core.Domain.CQRS;

namespace Ets.Modules.Users.Application.Users.AssignRole;

/// <summary>Gives the user <paramref name="UserId" /> the role <paramref name="RoleId" />.</summary>
/// <param name="UserId">The user's id.</param>
/// <param name="RoleId">The role's id.</param>
public sealed record AssignRoleCommand(Guid UserId, Guid RoleId) : ICommand;
