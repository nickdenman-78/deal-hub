using Ets.Core.Domain.ValueObjects;
using Ets.Modules.Deals.Domain.ValueObjects;

namespace EtsDealsTests.ValueObjects;

public sealed class CommodityCodeTests
{
    public static TheoryData<string, LoadProfileValue, FuturesPayoffValue, ContractPeriodValue> Families =>
        new()
        {
            {"EN", LoadProfileValue.BaseLoad, FuturesPayoffValue.Standard, ContractPeriodValue.Month},
            {"BN", LoadProfileValue.BaseLoad, FuturesPayoffValue.Standard, ContractPeriodValue.Quarter},
            {"HN", LoadProfileValue.BaseLoad, FuturesPayoffValue.Standard, ContractPeriodValue.Strip},
            {"PN", LoadProfileValue.PeakLoad, FuturesPayoffValue.Standard, ContractPeriodValue.Quarter},
            {"DN", LoadProfileValue.PeakLoad, FuturesPayoffValue.Standard, ContractPeriodValue.Strip},
            {"MN", LoadProfileValue.MorningPeak, FuturesPayoffValue.Standard, ContractPeriodValue.Quarter},
            {"JN", LoadProfileValue.MorningPeak, FuturesPayoffValue.Standard, ContractPeriodValue.Strip},
            {"NN", LoadProfileValue.EveningPeak, FuturesPayoffValue.Standard, ContractPeriodValue.Quarter},
            {"LN", LoadProfileValue.EveningPeak, FuturesPayoffValue.Standard, ContractPeriodValue.Strip},
            {"GN", LoadProfileValue.BaseLoad, FuturesPayoffValue.Cap300, ContractPeriodValue.Quarter},
            {"RN", LoadProfileValue.BaseLoad, FuturesPayoffValue.Cap300, ContractPeriodValue.Strip}
        };

    public static TheoryData<string, NEMRegionValue> Regions =>
        new()
        {
            {"BN", NEMRegionValue.NSW},
            {"BV", NEMRegionValue.VIC},
            {"BQ", NEMRegionValue.QLD},
            {"BS", NEMRegionValue.SA}
        };

    [Theory]
    [MemberData(nameof(Families))]
    public void Create_Decodes_TheProductFamily(
        string code,
        LoadProfileValue loadProfile,
        FuturesPayoffValue payoff,
        ContractPeriodValue period)
    {
        var result = CommodityCode.Create(code);

        result.IsSuccess.ShouldBeTrue();
        result.Value.LoadProfile.Value.ShouldBe(loadProfile);
        result.Value.Payoff.Value.ShouldBe(payoff);
        result.Value.Period.Value.ShouldBe(period);
    }

    [Theory]
    [MemberData(nameof(Regions))]
    public void Create_Decodes_TheRegion(string code, NEMRegionValue region)
    {
        CommodityCode.Create(code).Value.Region.Value.ShouldBe(region);
    }

    [Fact]
    public void Create_Normalises_CaseAndWhiteSpace()
    {
        CommodityCode.Create(" bq ").Value.Value.ShouldBe("BQ");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("B")]
    [InlineData("BNX")]
    [InlineData("XN")]
    [InlineData("BT")]
    public void Create_Fails_ForAnUnknownCode(string? code)
    {
        var result = CommodityCode.Create(code);

        result.IsFailure.ShouldBeTrue();
        result.Error!.Code.ShouldBe(CommodityCode.InvalidErrorCode);
    }

    [Fact]
    public void CommodityCodes_WithTheSameValue_AreEqual()
    {
        CommodityCode.Create("PV").Value.ShouldBe(CommodityCode.Create("pv").Value);
    }
}
