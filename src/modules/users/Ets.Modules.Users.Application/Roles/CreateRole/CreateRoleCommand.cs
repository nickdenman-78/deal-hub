using Ets.Core.Domain.CQRS;

namespace Ets.Modules.Users.Application.Roles.CreateRole;

/// <summary>Creates a role granting <paramref name="Permissions" />. Returns the new role's id.</summary>
/// <param name="Name">The role's name, unique across roles.</param>
/// <param name="Permissions">The permissions to grant, written <c>module:action</c>. May be empty.</param>
public sealed record CreateRoleCommand(string Name, IReadOnlyList<string> Permissions) : ICommand<Guid>;
