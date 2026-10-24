using Ets.Core.Domain.Models;
using Ets.Modules.Users.Domain.ValueObjects;

namespace Ets.Modules.Users.Application.Roles;

/// <summary>The failures the role use cases share.</summary>
internal static class RoleErrors
{
    public const string NotFoundErrorCode = "role.not-found";
    public const string NameTakenErrorCode = "role.name.taken";

    public static DomainError NotFound(Guid roleId)
    {
        return DomainError.NotFound(NotFoundErrorCode, $"There is no role {roleId}.");
    }

    public static DomainError NameTaken(RoleName name)
    {
        return DomainError.Conflict(NameTakenErrorCode, $"A role named {name} already exists.");
    }
}
