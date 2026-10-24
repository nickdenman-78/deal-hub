namespace Ets.Modules.Users.Presentation.Users;

/// <summary>A role to assign.</summary>
/// <param name="RoleId">The role's id.</param>
internal sealed record AssignRoleRequest(Guid? RoleId);
