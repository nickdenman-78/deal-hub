namespace Ets.Modules.Users.Presentation.Roles;

/// <summary>A new role.</summary>
/// <param name="Name">The role's name, such as <c>Trader</c>; unique across roles.</param>
/// <param name="Permissions">The permissions it grants, such as <c>deals:capture</c>. May be empty.</param>
internal sealed record CreateRoleRequest(string? Name, IReadOnlyList<string>? Permissions);
