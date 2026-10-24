namespace Ets.Modules.Users.Presentation.Roles;

/// <summary>A permission to grant.</summary>
/// <param name="Permission">The permission, written <c>module:action</c>, such as <c>deals:confirm</c>.</param>
internal sealed record GrantPermissionRequest(string? Permission);
