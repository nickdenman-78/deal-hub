using Ets.Core.Domain.ValueObjects;
using Ets.Modules.Deals.Domain.ValueObjects;

namespace EtsDealsTests.ValueObjects;

public sealed class ProductCodeTests
{
    public static TheoryData<string, string, TermSpanValue> Terms =>
        new()
        {
            {"ENF27", "Jan27", TermSpanValue.Month},
            {"ENZ26", "Dec26", TermSpanValue.Month},
            {"BNH26", "Q126", TermSpanValue.Quarter},
            {"BVM26", "Q226", TermSpanValue.Quarter},
            {"PQU26", "Q326", TermSpanValue.Quarter},
            {"GSZ26", "Q426", TermSpanValue.Quarter},
            {"HNZ26", "Cal27", TermSpanValue.CalYear},
            {"RQZ27", "Cal28", TermSpanValue.CalYear},
            {"HNM26", "Fin26/27", TermSpanValue.FinYear},
            {"DVM27", "Fin27/28", TermSpanValue.FinYear}
        };

    [Theory]
    [MemberData(nameof(Terms))]
    public void Create_Derives_TheTermFromTheCode(string code, string term, TermSpanValue span)
    {
        var result = ProductCode.Create(code);

        result.IsSuccess.ShouldBeTrue();
        result.Value.Term.Name.ShouldBe(term);
        result.Value.Term.Span.Value.ShouldBe(span);
    }

    [Fact]
    public void Create_Decodes_EveryPart()
    {
        var productCode = ProductCode.Create("BNH26").Value;

        productCode.Value.ShouldBe("BNH26");
        productCode.CommodityCode.Value.ShouldBe("BN");
        productCode.CommodityCode.Region.ShouldBe(NEMRegion.NSW);
        productCode.CommodityCode.LoadProfile.ShouldBe(LoadProfile.BaseLoad);
        productCode.ExpiryMonth.ShouldBe(ContractMonth.Mar);
        productCode.ExpiryYear.ShouldBe(2026);
        productCode.Term.StartDate.ShouldBe(new DateOnly(2026, 1, 1));
        productCode.Term.EndDate.ShouldBe(new DateOnly(2026, 3, 31));
    }

    [Fact]
    public void Create_Normalises_CaseAndWhiteSpace()
    {
        ProductCode.Create(" bnh26 ").Value.Value.ShouldBe("BNH26");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("BNH2")]
    [InlineData("BNH266")]
    [InlineData("BNH2X")]
    [InlineData("BN-26")]
    [InlineData("XNH26")]
    [InlineData("BTH26")]
    [InlineData("BNA26")]
    [InlineData("BNF26")]
    [InlineData("PVK26")]
    [InlineData("HNH26")]
    [InlineData("RQU26")]
    public void Create_Fails_ForACodeThatDoesNotDecodeToAProduct(string? code)
    {
        var result = ProductCode.Create(code);

        result.IsFailure.ShouldBeTrue();
        result.Error!.Code.ShouldBe(ProductCode.InvalidErrorCode);
    }

    [Fact]
    public void ProductCodes_WithTheSameValue_AreEqual()
    {
        ProductCode.Create("HNZ26").Value.ShouldBe(ProductCode.Create("hnz26").Value);
    }
}
