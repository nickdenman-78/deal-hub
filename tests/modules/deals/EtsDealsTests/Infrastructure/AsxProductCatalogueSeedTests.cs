using Ets.Modules.Deals.Domain.ValueObjects;
using Ets.Modules.Deals.Infrastructure.Persistence.Entities;
using Ets.Modules.Deals.Infrastructure.Products;

namespace EtsDealsTests.Infrastructure;

public sealed class AsxProductCatalogueSeedTests
{
    private static readonly IReadOnlyList<DbAsxProduct> Products = AsxProductCatalogueSeed.Load();

    [Fact]
    public void Load_ReadsTheWholeSchedule()
    {
        Products.Count.ShouldBe(1_009);
        Products.Select(product => product.ProductCode).ShouldBeUnique();
    }

    [Fact]
    public void Load_EveryCodeDecodes()
    {
        foreach (var product in Products)
        {
            ProductCode.Create(product.ProductCode).IsSuccess.ShouldBeTrue(product.ProductCode);
        }
    }

    [Fact]
    public void Load_DaysMatchTheTermTheCodeDecodesTo()
    {
        foreach (var product in Products)
        {
            var term = ProductCode.Create(product.ProductCode).Value.Term;
            int days = term.EndDate.DayNumber - term.StartDate.DayNumber + 1;

            // Peak contracts count trading days only, so they cover fewer days than the term.
            if (product.ProductCode[0] is 'P' or 'D')
            {
                product.NumberOfDays.ShouldBeLessThan(days, product.ProductCode);
            }
            else
            {
                product.NumberOfDays.ShouldBe(days, product.ProductCode);
            }
        }
    }

    [Theory]
    [InlineData("BQZ26", 92, 2_208)]
    [InlineData("ENF28", 31, 744)]
    [InlineData("ESG28", 29, 696)]
    [InlineData("PNH27", 60, 900)]
    [InlineData("MVU30", 92, 276)]
    [InlineData("NSH29", 90, 450)]
    [InlineData("GQM27", 91, 2_184)]
    [InlineData("HNZ26", 365, 8_760)]
    [InlineData("HQZ27", 366, 8_784)]
    [InlineData("DNM27", 253, 3_795)]
    public void Load_MatchesTheAsxSchedule(string code, int days, decimal megawattHours)
    {
        var product = Products.Single(p => p.ProductCode == code);

        product.NumberOfDays.ShouldBe(days);
        product.ContractSize.ShouldBe(megawattHours);
    }
}
