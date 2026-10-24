using Ets.Modules.Users.Domain.Models;

namespace Ets.Modules.Users.Application.Roles;

/// <summary>A role and the permissions it grants, as the role queries return it.</summary>
/// <param name="Id">The role's id.</param>
/// <param name="Name">The role's name, such as <c>Trader</c>.</param>
/// <param name="Permissions">The permissions the role grants, in the order they were granted.</param>
public sealed record RoleResponse(Guid Id, string Name, IReadOnlyList<string> Permissions)
{
    internal static RoleResponse From(Role role)
    {
        return new RoleResponse(
            role.Id.Value,
            role.Name.Value,
            [.. role.Permissions.Select(permission => permission.Value)]);
    }
}
