namespace Ets.Modules.Users.Presentation;

/// <summary>
///     OpenAPI document names owned by this module. The host pins each document to its group name with
///     <c>ShouldInclude</c> and names it to <c>MapScalarApiReference</c>.
/// </summary>
public static class OpenApiDocuments
{
    public const string Users = "users";

    /// <summary>The order the document's tags are presented in.</summary>
    public static IReadOnlyList<string> UsersTagOrder { get; } = [Tags.Users, Tags.Roles];
}
