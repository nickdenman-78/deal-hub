using Ets.Core.Application.Services;
using Ets.Core.Domain.Models;
using Ets.Core.Domain.Services;
using Ets.Core.Domain.ValueObjects;
using Ets.Modules.Deals.Application.Deals.CaptureAsxFuturesDeal;
using Ets.Modules.Deals.Domain.Events;
using Ets.Modules.Deals.Domain.Models;
using Ets.Modules.Deals.Domain.Repositories;
using Ets.Modules.Deals.Domain.Services;
using Ets.Modules.Deals.Domain.ValueObjects;

namespace EtsDealsTests.Application;

public sealed class CaptureAsxFuturesDealTests
{
    private static readonly Guid DealGuid = Guid.CreateVersion7();

    private readonly FakeCatalogue _catalogue = new();
    private readonly FakeDealRepository _deals = new();
    private readonly FakeUnitOfWork _unitOfWork = new();

    [Fact]
    public async Task Handle_Captures_AndSaves_TheDeal()
    {
        _catalogue.List("BNH26", 90, 2_160m);

        var result = await Handler().HandleAsync(Command("bnh26"), TestContext.Current.CancellationToken);

        result.IsSuccess.ShouldBeTrue();
        result.Value.ShouldBe(DealGuid);
        var deal = _deals.Added.ShouldHaveSingleItem().ShouldBeOfType<AsxFuturesDeal>();
        deal.UncommittedEvents.ShouldHaveSingleItem().ShouldBeOfType<AsxFuturesDealCaptured>();
        deal.Product.ContractSize.Energy.Value.ShouldBe(2_160m);
        _unitOfWork.Saves.ShouldBe(1);
    }

    [Fact]
    public async Task Handle_Fails_ForACodeThatDoesNotDecode()
    {
        var result = await Handler().HandleAsync(Command("BNF26"), TestContext.Current.CancellationToken);

        result.Error!.Code.ShouldBe(ProductCode.InvalidErrorCode);
        _deals.Added.ShouldBeEmpty();
        _unitOfWork.Saves.ShouldBe(0);
    }

    [Fact]
    public async Task Handle_Fails_ForAProductASXDoesNotList()
    {
        var result = await Handler().HandleAsync(Command("BNH26"), TestContext.Current.CancellationToken);

        result.Error!.Code.ShouldBe(FakeCatalogue.NotListedErrorCode);
        _deals.Added.ShouldBeEmpty();
        _unitOfWork.Saves.ShouldBe(0);
    }

    [Fact]
    public async Task Handle_Returns_TheAggregatesFailure()
    {
        _catalogue.List("BNH26", 90, 2_160m);

        var result = await Handler().HandleAsync(
            Command("BNH26") with {Volume = Volume.Create(2.5m, VolumeUnit.MW)},
            TestContext.Current.CancellationToken);

        result.Error!.Code.ShouldBe(AsxFuturesDeal.VolumeNotWholeLotsErrorCode);
        _deals.Added.ShouldBeEmpty();
        _unitOfWork.Saves.ShouldBe(0);
    }

    [Fact]
    public async Task Handle_Returns_TheSaveFailure()
    {
        _catalogue.List("BNH26", 90, 2_160m);
        _unitOfWork.Outcome = Result.Failure(DomainError.Conflict("deal.concurrency", "Someone else saved first."));

        var result = await Handler().HandleAsync(Command("BNH26"), TestContext.Current.CancellationToken);

        result.Error!.Code.ShouldBe("deal.concurrency");
    }

    [Fact]
    public void Validator_Accepts_ACompleteQuote()
    {
        new CaptureAsxFuturesDealCommandValidator().Validate(Command("BNH26")).IsValid.ShouldBeTrue();
    }

    [Fact]
    public void Validator_Rejects_AMissingPart()
    {
        var command = new CaptureAsxFuturesDealCommand(
            " ",
            null!,
            Amount.Create(null, AmountUnit.DollarPerMWh),
            Volume.Create(null, VolumeUnit.MW));

        var result = new CaptureAsxFuturesDealCommandValidator().Validate(command);

        result.Errors.Select(error => error.PropertyName)
            .ShouldBe(["ProductCode", "Direction", "Price", "Volume"], ignoreOrder: true);
    }

    private static CaptureAsxFuturesDealCommand Command(string productCode)
    {
        return new CaptureAsxFuturesDealCommand(
            productCode,
            TradeDirection.Buy,
            Amount.Create(95.50m, AmountUnit.DollarPerMWh),
            Volume.Create(5, VolumeUnit.MW));
    }

    private CaptureAsxFuturesDealCommandHandler Handler()
    {
        return new CaptureAsxFuturesDealCommandHandler(
            _catalogue,
            _deals,
            _unitOfWork,
            new FixedIdGenerator(DealGuid),
            new FrozenDateTimeProvider(new DateTimeOffset(2026, 10, 19, 9, 30, 0, TimeSpan.FromHours(10))));
    }

    private sealed class FakeCatalogue : IAsxProductCatalogue
    {
        public const string NotListedErrorCode = "test.not-listed";

        private readonly Dictionary<string, AsxProduct> _products = new(StringComparer.Ordinal);

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
            return Task.FromResult(_products.TryGetValue(productCode.Value, out var product)
                ? Result.Success(product)
                : Result.Failure<AsxProduct>(DomainError.NotFound(NotListedErrorCode, "Not listed.")));
        }
    }

    private sealed class FakeDealRepository : IExchangeDealRepository
    {
        public List<ExchangeDeal> Added { get; } = [];

        public void Add(ExchangeDeal deal)
        {
            Added.Add(deal);
        }
    }

    private sealed class FakeUnitOfWork : IDealsUnitOfWork
    {
        public Result Outcome { get; set; } = Result.Success();

        public int Saves { get; private set; }

        public Task<Result> SaveChangesAsync(CancellationToken cancellationToken)
        {
            Saves++;
            return Task.FromResult(Outcome);
        }
    }

    private sealed class FixedIdGenerator(Guid id) : IIdGenerator
    {
        public Guid NewId()
        {
            return id;
        }
    }
}
