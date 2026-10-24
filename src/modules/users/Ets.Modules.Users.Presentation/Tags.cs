namespace Ets.Modules.Users.Presentation;

/// <summary>
///     OpenAPI tags owned by this module. A tag is one collapsible section in the reference UI.
/// </summary>
/// <remarks>
///     A slice that names a tag REPLACES the tag the route group applies, rather than adding to it, so each
///     route appears in exactly one section. <see cref="Users" /> is the group's default; the role routes
///     name <see cref="Roles" />.
/// </remarks>
internal static class Tags
{
    internal const string Users = "Users";

    internal const string Roles = "Roles";
}
