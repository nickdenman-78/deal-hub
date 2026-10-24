namespace Ets.Modules.Deals.Presentation.Deals;

/// <summary>The trader's quote for an ASX futures deal.</summary>
/// <param name="ProductCode">The ASX product code, such as <c>BNH26</c> (NSW base, March 2026).</param>
/// <param name="Direction"><c>Buy</c> or <c>Sell</c>.</param>
/// <param name="Price">The price in $/MWh.</param>
/// <param name="Volume">The volume in lots; one lot is 1 MW.</param>
internal sealed record CaptureAsxFuturesDealRequest(
    string? ProductCode,
    string? Direction,
    decimal? Price,
    decimal? Volume);
