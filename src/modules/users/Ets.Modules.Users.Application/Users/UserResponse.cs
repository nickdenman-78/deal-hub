using Ets.Modules.Users.Domain.Models;
using Ets.Modules.Users.Domain.ValueObjects;

namespace Ets.Modules.Users.Application.Users;

/// <summary>A user and the roles they hold, as the user queries return it.</summary>
/// <param name="Id">The user's id.</param>
/// <param name="IdentityId">Their Keycloak subject (the token's <c>sub</c>).</param>
/// <param name="UserName">The name they sign in with.</param>
/// <param name="Roles">The roles they hold, in the order they were assigned.</param>
public sealed record UserResponse(Guid Id, string IdentityId, string UserName, IReadOnlyList<UserRoleResponse> Roles)
{
    /// <param name="user">The user.</param>
    /// <param name="roleNames">The name of every role, by id.</param>
    internal static UserResponse From(User user, IReadOnlyDictionary<RoleId, string> roleNames)
    {
        return new UserResponse(
            user.Id.Value,
            user.IdentityId.Value,
            user.UserName,
            [
                .. user.RoleAssignments.Select(assignment => new UserRoleResponse(
                    assignment.RoleId.Value,
                    roleNames.GetValueOrDefault(assignment.RoleId, string.Empty),
                    assignment.AssignedAt))
            ]);
    }
}

/// <summary>A role a user holds.</summary>
/// <param name="RoleId">The role's id.</param>
/// <param name="Name">The role's name.</param>
/// <param name="AssignedAt">When the role was assigned to the user.</param>
public sealed record UserRoleResponse(Guid RoleId, string Name, DateTimeOffset AssignedAt);
