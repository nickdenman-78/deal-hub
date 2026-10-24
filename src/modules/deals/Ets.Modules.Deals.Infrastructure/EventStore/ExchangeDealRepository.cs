using Ets.Modules.Deals.Domain.Models;
using Ets.Modules.Deals.Domain.Repositories;

namespace Ets.Modules.Deals.Infrastructure.EventStore;

/// <summary>
///     Exchange deals as Marten event streams. Adding a deal only tracks it: its events are appended when the
///     unit of work saves, so events raised after <see cref="Add" /> are not lost.
/// </summary>
[UsedImplicitly]
internal sealed class ExchangeDealRepository(DealsEventSession session) : IExchangeDealRepository
{
    public void Add(ExchangeDeal deal)
    {
        session.Track(deal);
    }
}
