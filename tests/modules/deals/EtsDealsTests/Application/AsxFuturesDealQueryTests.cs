using Ets.Core.Domain.Models;
using Ets.Core.Domain.ValueObjects;
using Ets.Modules.Deals.Application.Deals;
using Ets.Modules.Deals.Application.Deals.GetAsxFuturesDeal;
using Ets.Modules.Deals.Application.Deals.ListAsxFuturesDeals;
using Ets.Modules.Deals.Application.Deals.LookUpAsxProduct;
using Ets.Modules.Deals.Domain.Events;
using Ets.Modules.Deals.Domain.Services;
using Ets.Modules.Deals.Domain.ValueObjects;

namespace EtsDealsTests.Application;

public sealed class AsxFuturesDealQueryTests
{
    private readonly FakeCatalogue _catalogue = new();
    private readonly FakeDealQueries _deals = new();

    [Fact]
    public void Response_From_Captured_DecodesTheProduct_AndComputesContractedEnergy()
    {
        var deal = AsxFuturesDealResponse.From(Captured("BNH27", 90, 2_160m, 5m, 112.50m));

        deal.Direction.ShouldBe("Buy");
        deal.Price.ShouldBe(112.50m);
        deal.Volume.ShouldBe(5m);
        deal.ContractedEnergy.ShouldBe(10_800m);
        deal.Product.ProductCode.ShouldBe("BNH27");
        deal.Product.Region.ShouldBe("NSW");
        deal.Product.LoadProfile.ShouldBe("Base load");
        deal.Product.Payoff.ShouldBe("Standard");
        deal.Product.Period.ShouldBe("Quarter");
        deal.Product.Term.ShouldBe(ProductCode.Create("BNH27").Value.Term.Name);
        deal.Product.TermStart.ShouldBe(new DateOnly(2027, 1, 1));
        deal.Product.TermEnd.ShouldBe(new DateOnly(2027, 3, 31));
        deal.Product.Listed.ShouldBeTrue();
        deal.Product.ContractDays.ShouldBe(90);
        deal.Product.ContractSize.ShouldBe(2_160m);
    }

    [Fact]
    public async Task List_Returns_TheReadSidesDeals()
    {
        _deals.Add(AsxFuturesDealResponse.From(Captured("BNH27", 90, 2_160m, 5m, 112.50m)));

        var result = await new ListAsxFuturesDealsQueryHandler(_deals)
            .HandleAsync(new ListAsxFuturesDealsQuery(), TestContext.Current.CancellationToken);

        result.Value.ShouldHaveSingleItem().Product.ProductCode.ShouldBe("BNH27");
    }

    [Fact]
    public async Task Get_Returns_TheDeal()
    {
        var deal = AsxFuturesDealResponse.From(Captured("BNH27", 90, 2_160m, 5m, 112.50m));
        _deals.Add(deal);

        var result = await new GetAsxFuturesDealQueryHandler(_deals)
            .HandleAsync(new GetAsxFuturesDealQuery(deal.Id), TestContext.Current.CancellationToken);

        result.Value.ShouldBe(deal);
    }

    [Fact]
    public async Task Get_Fails_NotFound_ForAnUnknownDeal()
    {
        var result = await new GetAsxFuturesDealQueryHandler(_deals)
            .HandleAsync(new GetAsxFuturesDealQuery(Guid.CreateVersion7()), TestContext.Current.CancellationToken);

        result.Error!.Code.ShouldBe(DealErrors.NotFoundErrorCode);
        result.Error.Type.ShouldBe(DomainErrorType.NotFound);
    }

    [Fact]
    public async Task LookUp_Returns_AListedProduct_WithItsContractSize()
    {
        _catalogue.List("BNH27", 90, 2_160m);

        var result = await new LookUpAsxProductQueryHandler(_catalogue)
            .HandleAsync(new LookUpAsxProductQuery("bnh27"), TestContext.Current.CancellationToken);

        result.Value.ProductCode.ShouldBe("BNH27");
        result.Value.Listed.ShouldBeTrue();
        result.Value.ContractSize.ShouldBe(2_160m);
    }

    [Fact]
    public async Task LookUp_Returns_AnUnlistedProduct_DecodedButWithoutASize()
    {
        var result = await new LookUpAsxProductQueryHandler(_catalogue)
            .HandleAsync(new LookUpAsxProductQuery("BNH33"), TestContext.Current.CancellationToken);

        result.IsSuccess.ShouldBeTrue();
        result.Value.Region.ShouldBe("NSW");
        result.Value.Listed.ShouldBeFalse();
        result.Value.ContractSize.ShouldBeNull();
    }

    [Fact]
    public async Task LookUp_Fails_ForACodeThatDoesNotDecode()
    {
        var result = await new LookUpAsxProductQueryHandler(_catalogue)
            .HandleAsync(new LookUpAsxProductQuery("BNF26"), TestContext.Current.CancellationToken);

        result.Error!.Code.ShouldBe(ProductCode.InvalidErrorCode);
    }

    [Fact]
    public async Task LookUp_Returns_ACatalogueFailureThatIsNotNotFound()
    {
        _catalogue.Failure = DomainError.Problem("test.catalogue-down", "The catalogue is unavailable.");

        var result = await new LookUpAsxProductQueryHandler(_catalogue)
            .HandleAsync(new LookUpAsxProductQuery("BNH27"), TestContext.Current.CancellationToken);

        result.Error!.Code.ShouldBe("test.catalogue-down");
    }

    private static AsxFuturesDealCaptured Captured(
        string code,
        int days,
        decimal megawattHoursPerLot,
        decimal lots,
        decimal price)
    {
        var product = new AsxProduct(
            ProductCode.Create(code).Value,
            ContractSize.Create(days, Volume.Create(megawattHoursPerLot, VolumeUnit.MWh)).Value);

        return new AsxFuturesDealCaptured(
            new DealId(Guid.CreateVersion7()),
            product,
            TradeDirection.Buy,
            Amount.Create(price, AmountUnit.DollarPerMWh),
            Volume.Create(lots, VolumeUnit.MW),
            new DateTimeOffset(2026, 10, 31, 10, 42, 0, TimeSpan.FromHours(10)));
    }

    private sealed class FakeCatalogue : IAsxProductCatalogue
    {
        private readonly Dictionary<string, AsxProduct> _products = new(StringComparer.Ordinal);

        public DomainError? Failure { get; set; }

        public void List(string code, int days, decimal megawattHoursPerLot)
        {
            _products[code] = new AsxProduct(
                ProductCode.Create(code).Value,
                ContractSize.Create(days, Volume.Create(megawattHoursPerLot, VolumeUnit.MWh)).Value);
        }

        public Task<Result<AsxProduct>> FindListedProductAsync(
            ProductCode productCode,
            CancellationToken cancellationToken)
        {
            if (Failure is not null)
            {
                return Task.FromResult(Result.Failure<AsxProduct>(Failure));
            }

            return Task.FromResult(_products.TryGetValue(productCode.Value, out var product)
                ? Result.Success(product)
                : Result.Failure<AsxProduct>(DomainError.NotFound("test.not-listed", "Not listed.")));
        }
    }

    private sealed class FakeDealQueries : IAsxFuturesDealQueries
    {
        private readonly List<AsxFuturesDealResponse> _deals = [];

        public void Add(AsxFuturesDealResponse deal)
        {
            _deals.Add(deal);
        }

        public Task<IReadOnlyList<AsxFuturesDealResponse>> ListAsync(CancellationToken cancellationToken)
        {
            return Task.FromResult<IReadOnlyList<AsxFuturesDealResponse>>(_deals);
        }

        public Task<AsxFuturesDealResponse?> FindAsync(Guid dealId, CancellationToken cancellationToken)
        {
            return Task.FromResult(_deals.FirstOrDefault(deal => deal.Id == dealId));
        }
    }
}
