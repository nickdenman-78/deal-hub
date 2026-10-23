using Ets.Modules.Deals.Domain.ValueObjects;

namespace EtsDealsTests.ValueObjects;

public sealed class DealNameTests
{
    [Fact]
    public void Create_Keeps_TheName()
    {
        DealName.Create("QLD base Q126").Value.ShouldBe("QLD base Q126");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_Throws_ForABlankName(string? name)
    {
        Should.Throw<ArgumentException>(() => DealName.Create(name));
    }

    [Fact]
    public void DealNames_WithTheSameValue_AreEqual()
    {
        DealName.Create("Cal27 swap").ShouldBe(DealName.Create("Cal27 swap"));
    }
}
