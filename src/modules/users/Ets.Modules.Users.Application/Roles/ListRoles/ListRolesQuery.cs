using Ets.Core.Domain.CQRS;

namespace Ets.Modules.Users.Application.Roles.ListRoles;

/// <summary>Every role and the permissions it grants, ordered by name.</summary>
public sealed record ListRolesQuery : IQuery<IReadOnlyList<RoleResponse>>;
