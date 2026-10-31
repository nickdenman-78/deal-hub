using System.Globalization;
using System.Reflection;
using Ets.Modules.Deals.Infrastructure.Persistence.Entities;

namespace Ets.Modules.Deals.Infrastructure.Products;

/// <summary>
///     The Development copy of ASX's contract size schedule (<c>asx-contract-sizes.csv</c>, embedded in this
///     assembly), the rows <see cref="AsxProductCatalogue" /> reads. A deployed catalogue is loaded from ASX's
///     current schedule instead.
/// </summary>
internal static class AsxProductCatalogueSeed
{
    private const string ResourceName = "Ets.Modules.Deals.Infrastructure.Products.asx-contract-sizes.csv";

    /// <summary>Every product in the file. Lines starting with <c>#</c> and the header are skipped.</summary>
    public static IReadOnlyList<DbAsxProduct> Load()
    {
        using var stream = Assembly.GetExecutingAssembly().GetManifestResourceStream(ResourceName)
                           ?? throw new InvalidOperationException($"The embedded resource '{ResourceName}' is missing.");
        using var reader = new StreamReader(stream);

        var products = new List<DbAsxProduct>();

        while (reader.ReadLine() is { } line)
        {
            if (line.Length == 0 || line.StartsWith('#') || line.StartsWith("product_code", StringComparison.Ordinal))
            {
                continue;
            }

            string[] fields = line.Split(',');

            if (fields.Length != 3)
            {
                throw new FormatException($"'{line}' is not 'product_code,number_of_days,contract_size'.");
            }

            products.Add(new DbAsxProduct
            {
                ProductCode = fields[0],
                NumberOfDays = int.Parse(fields[1], NumberStyles.None, CultureInfo.InvariantCulture),
                ContractSize = decimal.Parse(fields[2], NumberStyles.AllowDecimalPoint, CultureInfo.InvariantCulture)
            });
        }

        return products;
    }
}
