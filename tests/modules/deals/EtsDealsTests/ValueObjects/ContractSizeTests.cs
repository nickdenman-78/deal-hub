using Ets.Core.Domain.ValueObjects;
using Ets.Modules.Deals.Domain.ValueObjects;

namespace EtsDealsTests.ValueObjects;

public sealed class ContractSizeTests
{
    [Fact]
    public void Create_Keeps_DaysAndEnergy()
    {
        var result = ContractSize.Create(90, Volume.Create(2_160m, VolumeUnit.MWh));

        result.IsSuccess.ShouldBeTrue();
        result.Value.NumberOfDays.ShouldBe(90);
        result.Value.Energy.Value.ShouldBe(2_160m);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Create_Fails_WithoutAPositiveNumberOfDays(int days)
    {
        var result = ContractSize.Create(days, Volume.Create(2_160m, VolumeUnit.MWh));

        result.IsFailure.ShouldBeTrue();
        result.Error!.Code.ShouldBe(ContractSize.InvalidErrorCode);
    }

    [Theory]
    [InlineData(2_160, VolumeUnitValue.MW)]
    [InlineData(2_160, VolumeUnitValue.KWh)]
    [InlineData(0, VolumeUnitValue.MWh)]
    [InlineData(-1, VolumeUnitValue.MWh)]
    public void Create_Fails_WithoutAPositiveEnergyInMWh(int energy, VolumeUnitValue unit)
    {
        var result = ContractSize.Create(90, Volume.Create(energy, unit));

        result.IsFailure.ShouldBeTrue();
        result.Error!.Code.ShouldBe(ContractSize.InvalidErrorCode);
    }
}
