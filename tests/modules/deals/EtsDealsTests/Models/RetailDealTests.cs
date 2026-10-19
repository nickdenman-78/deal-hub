using Ets.Core.Application.Services;
using Ets.Core.Domain.Services;
using Ets.Modules.Deals.Domain.Events;
using Ets.Modules.Deals.Domain.Models;
using Ets.Modules.Deals.Domain.ValueObjects;

namespace EtsDealsTests.Models;

public sealed class RetailDealTests
{
    private static readonly DateTimeOffset Now = new(2026, 10, 18, 7, 0, 0, TimeSpan.Zero);

    private readonly FrozenDateTimeProvider _clock = new(Now);
    private readonly FixedIdGenerator _ids = new(Guid.CreateVersion7());

    [Fact]
    public void Capture_Raises_RetailDealCaptured_WithADomainGeneratedId()
    {
        var deal = RetailDeal.Capture(_ids, _clock);

        deal.Id.ShouldBe(new DealId(_ids.Id));
        var captured = deal.UncommittedEvents.ShouldHaveSingleItem().ShouldBeOfType<RetailDealCaptured>();
        captured.DealId.ShouldBe(deal.Id);
        captured.OccurredAt.ShouldBe(_clock.Now);
    }

    [Fact]
    public void LoadFromHistory_Rebuilds_TheDealFromItsStream()
    {
        var captured = RetailDeal.Capture(_ids, _clock);
        var rehydrated = (RetailDeal)Activator.CreateInstance(typeof(RetailDeal), nonPublic: true)!;

        rehydrated.LoadFromHistory(captured.UncommittedEvents);

        rehydrated.Id.ShouldBe(captured.Id);
        rehydrated.Version.ShouldBe(1);
        rehydrated.UncommittedEvents.ShouldBeEmpty();
    }

    private sealed class FixedIdGenerator(Guid id) : IIdGenerator
    {
        public Guid Id { get; } = id;

        public Guid NewId()
        {
            return Id;
        }
    }
}
