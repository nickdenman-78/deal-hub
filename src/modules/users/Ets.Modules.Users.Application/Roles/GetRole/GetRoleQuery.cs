using Ets.Core.Domain.CQRS;

namespace Ets.Modules.Users.Application.Roles.GetRole;

/// <summary>One role and the permissions it grants.</summary>
/// <param name="RoleId">The role's id.</param>
public sealed record GetRoleQuery(Guid RoleId) : IQuery<RoleResponse>;
