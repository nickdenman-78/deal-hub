using Ets.Modules.Deals.Domain.ValueObjects;

namespace Ets.Modules.Deals.Application.Deals;

/// <summary>An ASX product code decoded into what it trades, and its contract size when ASX lists it.</summary>
/// <param name="ProductCode">The ASX 24 product code, such as <c>BNH27</c>.</param>
/// <param name="Region">The NEM region code, such as <c>NSW</c>.</param>
/// <param name="RegionDescription">The region's name, such as "New South Wales and ACT".</param>
/// <param name="LoadProfile">The load profile's name, such as "Base load".</param>
/// <param name="LoadProfileDescription">The profile's trading window (AEST).</param>
/// <param name="Payoff">"Standard" or "$300 cap".</param>
/// <param name="PayoffDescription">How the contract settles.</param>
/// <param name="Strike">The cap strike in $/MWh; <c>null</c> for standard futures.</param>
/// <param name="Period">"Month", "Quarter" or "Strip".</param>
/// <param name="ExpiryMonth">The expiry month, 1 to 12.</param>
/// <param name="ExpiryYear">The four-digit expiry year.</param>
/// <param name="Term">The term's name, such as "Q1 2027".</param>
/// <param name="TermStart">The first day of the term.</param>
/// <param name="TermEnd">The last day of the term.</param>
/// <param name="Listed">Whether ASX lists the product. An unlisted code decodes but has no contract size.</param>
/// <param name="ContractDays">The days one lot covers, as ASX publishes it; <c>null</c> when not listed.</param>
/// <param name="ContractSize">The MWh one lot delivers over the term; <c>null</c> when not listed.</param>
public sealed record AsxProductResponse(
    string ProductCode,
    string Region,
    string RegionDescription,
    string LoadProfile,
    string LoadProfileDescription,
    string Payoff,
    string PayoffDescription,
    decimal? Strike,
    string Period,
    int ExpiryMonth,
    int ExpiryYear,
    string Term,
    DateOnly TermStart,
    DateOnly TermEnd,
    bool Listed,
    int? ContractDays,
    decimal? ContractSize)
{
    /// <summary>A listed product, with its contract size.</summary>
    internal static AsxProductResponse From(AsxProduct product)
    {
        ArgumentNullException.ThrowIfNull(product);

        return From(product.ProductCode) with
        {
            Listed = true,
            ContractDays = product.ContractSize.NumberOfDays,
            ContractSize = product.ContractSize.Energy.Value
        };
    }

    /// <summary>A decoded product code, not (yet) known to be listed.</summary>
    internal static AsxProductResponse From(ProductCode code)
    {
        ArgumentNullException.ThrowIfNull(code);

        var commodity = code.CommodityCode;

        return new AsxProductResponse(
            code.Value,
            commodity.Region.Name,
            commodity.Region.Description,
            commodity.LoadProfile.Name,
            commodity.LoadProfile.Description,
            commodity.Payoff.Name,
            commodity.Payoff.Description,
            commodity.Payoff.Strike,
            commodity.Period.Name,
            code.ExpiryMonth.Month,
            code.ExpiryYear,
            code.Term.Name,
            code.Term.StartDate,
            code.Term.EndDate,
            false,
            null,
            null);
    }
}
