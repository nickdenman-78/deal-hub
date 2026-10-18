using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace Ets.Servers.Api.OpenApi;

/// <summary>
///     Host-side shaping of a generated OpenAPI document.
/// </summary>
internal static class OpenApiOptionsExtensions
{
    /// <summary>
    ///     Presents the document's tags — the reference UI's sections — in the order the owning module
    ///     states, rather than the order its routes happened to be registered in. A tag the module did
    ///     not name follows the ones it did, so adding a section without listing it degrades to
    ///     appearing last instead of vanishing.
    /// </summary>
    internal static OpenApiOptions OrderTags(this OpenApiOptions options, IReadOnlyList<string> order)
    {
        ArgumentNullException.ThrowIfNull(options);
        ArgumentNullException.ThrowIfNull(order);

        return options.AddDocumentTransformer((document, _, _) =>
        {
            if (document.Tags is { Count: > 0 })
            {
                document.Tags = new SortedSet<OpenApiTag>(document.Tags, new TagOrderComparer(order));
            }

            return Task.CompletedTask;
        });
    }

    /// <summary>
    ///     Orders tags by their position in the stated list, then by name.
    /// </summary>
    private sealed class TagOrderComparer(IReadOnlyList<string> order) : IComparer<OpenApiTag>
    {
        private readonly Dictionary<string, int> _positions = order
            .Select((name, index) => (name, index))
            .ToDictionary(entry => entry.name, entry => entry.index, StringComparer.Ordinal);

        public int Compare(OpenApiTag? x, OpenApiTag? y)
        {
            string left = x?.Name ?? string.Empty;
            string right = y?.Name ?? string.Empty;

            int comparison = Position(left).CompareTo(Position(right));

            // Two different tags must never compare equal: the set this feeds treats an equal
            // comparison as a duplicate and silently keeps only one of them.
            return comparison != 0 ? comparison : string.CompareOrdinal(left, right);
        }

        private int Position(string name)
        {
            return _positions.TryGetValue(name, out int position) ? position : int.MaxValue;
        }
    }
}
