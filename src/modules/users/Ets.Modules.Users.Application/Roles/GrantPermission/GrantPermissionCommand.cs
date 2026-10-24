using Ets.Core.Domain.CQRS;

namespace Ets.Modules.Users.Application.Roles.GrantPermission;

/// <summary>Grants <paramref name="Permission" /> to the role <paramref name="RoleId" />.</summary>
/// <param name="RoleId">The role's id.</param>
/// <param name="Permission">The permission, written <c>module:action</c>.</param>
public sealed record GrantPermissionCommand(Guid RoleId, string Permission) : ICommand;
