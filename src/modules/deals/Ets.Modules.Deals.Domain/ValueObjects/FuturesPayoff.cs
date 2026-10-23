using Ets.Core.Domain.ValueObjects;

namespace Ets.Modules.Deals.Domain.ValueObjects;

/// <summary>
///     How an ASX electricity futures contract pays out: standard futures settle against the average spot
///     price; $300 cap futures against the average of spot prices above the $300/MWh strike.
/// </summary>
/// <remarks>The CML's <c>Decimal strike</c> is <c>null</c> for standard futures, which have no strike.</remarks>
public abstract record FuturesPayoff : Enumeration<FuturesPayoffValue, FuturesPayoff>
{
    [UsedImplicitly] public static readonly FuturesPayoff None = new UnspecifiedPayoff();
    [UsedImplicitly] public static readonly FuturesPayoff Standard = new StandardPayoff();
    [UsedImplicitly] public static readonly FuturesPayoff Cap300 = new Cap300Payoff();

    private FuturesPayoff(FuturesPayoffValue value, string name, decimal? strike, string description)
        : base(value, name)
    {
        Strike = strike;
        Description = description;
    }

    /// <summary>The cap level in $/MWh, or <c>null</c> when the payoff has none.</summary>
    [UsedImplicitly] public decimal? Strike { get; }

    [UsedImplicitly] public string Description { get; }

    private sealed record UnspecifiedPayoff() : FuturesPayoff(FuturesPayoffValue.None, string.Empty, null, string.Empty);

    private sealed record StandardPayoff() : FuturesPayoff(
        FuturesPayoffValue.Standard,
        "Standard",
        null,
        "Settles against the average spot price over the term");

    private sealed record Cap300Payoff() : FuturesPayoff(
        FuturesPayoffValue.Cap300,
        "$300 cap",
        300m,
        "Settles against the average of spot prices above $300/MWh over the term");
}
