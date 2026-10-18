namespace Ets.Modules.Deals.Presentation;

/// <summary>
///     OpenAPI document names owned by this module. One document per module keeps generated clients aligned
///     to the module boundary; the host pins each document to its group name with <c>ShouldInclude</c> and
///     names it to <c>MapScalarApiReference</c>.
/// </summary>
public static class OpenApiDocuments
{
    public const string Deals = "deals";

    /// <summary>
    ///     The order the document's tags are presented in. Stated because a document otherwise lists its tags
    ///     in the order routes happen to be registered, which is neither stable nor meaningful to a reader.
    /// </summary>
    public static IReadOnlyList<string> DealsTagOrder { get; } = [Tags.Deals];
}
