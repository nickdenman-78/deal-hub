using Ets.Core.Domain.Models;
using Ets.Core.Domain.ValueObjects;

namespace Ets.Modules.Deals.Domain.ValueObjects;

/// <summary>
///     The two-letter ASX 24 commodity code. The first letter names the product family, the second the NEM
///     region (N = NSW, V = VIC, Q = QLD, S = SA); ASX lists electricity futures for these four regions only.
/// </summary>
/// <remarks>
///     <code>
///     E  base load month             B  base load quarter             H  base load strip
///     P  peak load quarter           D  peak load strip
///     M  morning peak quarter        J  morning peak strip
///     N  evening peak quarter        L  evening peak strip
///     G  base load $300 cap quarter  R  base load $300 cap strip
///     </code>
/// </remarks>
public sealed record CommodityCode : IValueObject
{
    public const string InvalidErrorCode = "deal.commodity-code.invalid";

    private static readonly Dictionary<char, (LoadProfile LoadProfile, FuturesPayoff Payoff, ContractPeriod Period)>
        Families = new()
        {
            ['E'] = (LoadProfile.BaseLoad, FuturesPayoff.Standard, ContractPeriod.Month),
            ['B'] = (LoadProfile.BaseLoad, FuturesPayoff.Standard, ContractPeriod.Quarter),
            ['H'] = (LoadProfile.BaseLoad, FuturesPayoff.Standard, ContractPeriod.Strip),
            ['P'] = (LoadProfile.PeakLoad, FuturesPayoff.Standard, ContractPeriod.Quarter),
            ['D'] = (LoadProfile.PeakLoad, FuturesPayoff.Standard, ContractPeriod.Strip),
            ['M'] = (LoadProfile.MorningPeak, FuturesPayoff.Standard, ContractPeriod.Quarter),
            ['J'] = (LoadProfile.MorningPeak, FuturesPayoff.Standard, ContractPeriod.Strip),
            ['N'] = (LoadProfile.EveningPeak, FuturesPayoff.Standard, ContractPeriod.Quarter),
            ['L'] = (LoadProfile.EveningPeak, FuturesPayoff.Standard, ContractPeriod.Strip),
            ['G'] = (LoadProfile.BaseLoad, FuturesPayoff.Cap300, ContractPeriod.Quarter),
            ['R'] = (LoadProfile.BaseLoad, FuturesPayoff.Cap300, ContractPeriod.Strip)
        };

    private static readonly Dictionary<char, NEMRegion> Regions = new()
    {
        ['N'] = NEMRegion.NSW,
        ['V'] = NEMRegion.VIC,
        ['Q'] = NEMRegion.QLD,
        ['S'] = NEMRegion.SA
    };

    private CommodityCode(
        string value,
        LoadProfile loadProfile,
        FuturesPayoff payoff,
        ContractPeriod period,
        NEMRegion region)
    {
        Value = value;
        LoadProfile = loadProfile;
        Payoff = payoff;
        Period = period;
        Region = region;
    }

    [UsedImplicitly] public string Value { get; }

    [UsedImplicitly] public LoadProfile LoadProfile { get; }

    [UsedImplicitly] public FuturesPayoff Payoff { get; }

    [UsedImplicitly] public ContractPeriod Period { get; }

    [UsedImplicitly] public NEMRegion Region { get; }

    /// <summary>Decodes a commodity code such as <c>BN</c>, ignoring case and surrounding white space.</summary>
    [UsedImplicitly]
    public static Result<CommodityCode> Create(string? value)
    {
        string code = value?.Trim().ToUpperInvariant() ?? string.Empty;

        if (code.Length != 2 ||
            !Families.TryGetValue(code[0], out var family) ||
            !Regions.TryGetValue(code[1], out var region))
        {
            return Result.Failure<CommodityCode>(DomainError.Validation(
                InvalidErrorCode,
                $"'{value}' is not an ASX electricity futures commodity code."));
        }

        return new CommodityCode(code, family.LoadProfile, family.Payoff, family.Period, region);
    }

    public override string ToString()
    {
        return Value;
    }
}
