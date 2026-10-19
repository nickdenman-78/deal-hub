using Ets.Core.Domain.ValueObjects;
using Ets.Modules.Deals.Domain.ValueObjects;

namespace EtsDealsTests.ValueObjects;

public sealed class EnumerationTests
{
    public static TheoryData<string, ContractMonthValue> MonthLetters =>
        new()
        {
            {"F", ContractMonthValue.Jan},
            {"G", ContractMonthValue.Feb},
            {"H", ContractMonthValue.Mar},
            {"J", ContractMonthValue.Apr},
            {"K", ContractMonthValue.May},
            {"M", ContractMonthValue.Jun},
            {"N", ContractMonthValue.Jul},
            {"Q", ContractMonthValue.Aug},
            {"U", ContractMonthValue.Sep},
            {"V", ContractMonthValue.Oct},
            {"X", ContractMonthValue.Nov},
            {"Z", ContractMonthValue.Dec}
        };

    [Theory]
    [MemberData(nameof(MonthLetters))]
    public void ContractMonth_TryFromCode_Maps_TheFuturesMonthLetter(string code, ContractMonthValue month)
    {
        ContractMonth.TryFromCode(code, out var contractMonth).ShouldBeTrue();
        contractMonth!.Value.ShouldBe(month);
        contractMonth.Month.ShouldBe((int)month);
    }

    [Fact]
    public void ContractMonth_TryFromCode_Ignores_Case()
    {
        ContractMonth.TryFromCode("z", out var contractMonth).ShouldBeTrue();
        contractMonth.ShouldBe(ContractMonth.Dec);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("A")]
    [InlineData("FG")]
    public void ContractMonth_TryFromCode_Fails_ForAnUnknownLetter(string? code)
    {
        ContractMonth.TryFromCode(code, out var contractMonth).ShouldBeFalse();
        contractMonth.ShouldBeNull();
    }

    [Fact]
    public void PeakLoad_Covers_WeekdaysOutsidePublicHolidays()
    {
        LoadProfile.PeakLoad.WeekdaysOnly.ShouldBeTrue();
        LoadProfile.PeakLoad.ExcludesPublicHolidays.ShouldBeTrue();
        LoadProfile.PeakLoad.TimeRange.From.ShouldBe(new TimeOnly(7, 0));
        LoadProfile.PeakLoad.TimeRange.To.ShouldBe(new TimeOnly(22, 0));
    }

    [Fact]
    public void BaseLoad_Covers_EveryHourOfEveryDay()
    {
        LoadProfile.BaseLoad.WeekdaysOnly.ShouldBeFalse();
        LoadProfile.BaseLoad.ExcludesPublicHolidays.ShouldBeFalse();
        LoadProfile.BaseLoad.TimeRange.Contains(TimeOnly.MinValue).ShouldBeTrue();
        LoadProfile.BaseLoad.TimeRange.Contains(new TimeOnly(23, 59, 59)).ShouldBeTrue();
    }

    [Theory]
    [InlineData("MorningPeak", 6, 9)]
    [InlineData("EveningPeak", 16, 21)]
    public void ShoulderPeaks_Cover_EveryDay(string name, int fromHour, int toHour)
    {
        LoadProfile.TryParse(name, out var profile).ShouldBeTrue();
        profile!.WeekdaysOnly.ShouldBeFalse();
        profile.TimeRange.ShouldBe(new TimeRange(new TimeOnly(fromHour, 0), new TimeOnly(toHour, 0)));
    }

    [Fact]
    public void Cap300_Has_AStrikeOf300()
    {
        FuturesPayoff.Cap300.Strike.ShouldBe(300m);
        FuturesPayoff.Standard.Strike.ShouldBeNull();
    }

    [Theory]
    [InlineData("buy", TradeDirectionValue.Buy)]
    [InlineData("Sell", TradeDirectionValue.Sell)]
    public void TradeDirection_TryParse_Accepts_BuyAndSell(string value, TradeDirectionValue direction)
    {
        TradeDirection.TryParse(value, out var tradeDirection).ShouldBeTrue();
        tradeDirection!.Value.ShouldBe(direction);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("None")]
    [InlineData("Hold")]
    public void TradeDirection_TryParse_Rejects_AnythingElse(string? value)
    {
        TradeDirection.TryParse(value, out _).ShouldBeFalse();
    }
}
