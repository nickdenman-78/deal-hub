using Ets.Core.Domain.CQRS;

namespace Ets.Modules.Users.Application.Roles.RevokePermission;

/// <summary>Revokes <paramref name="Permission" /> from the role <paramref name="RoleId" />.</summary>
/// <param name="RoleId">The role's id.</param>
/// <param name="Permission">The permission, written <c>module:action</c>.</param>
public sealed record RevokePermissionCommand(Guid RoleId, string Permission) : ICommand;
