using Ets.Modules.Deals.Application.Deals;
using Ets.Modules.Deals.Domain.Events;
using Marten;

namespace Ets.Modules.Deals.Infrastructure.EventStore;

/// <summary>
///     The deal list and deal details, read straight from the event streams. An ASX futures deal has one event so
///     far, <see cref="AsxFuturesDealCaptured" />, so that event is the deal.
/// </summary>
/// <remarks>
///     Interim: once deals can be amended or cancelled this becomes an async projection (ADR-0013), and the list
///     moves to a read model with server-side paging and filters.
/// </remarks>
[UsedImplicitly]
internal sealed class AsxFuturesDealQueries(IDealsStore store) : IAsxFuturesDealQueries
{
    public async Task<IReadOnlyList<AsxFuturesDealResponse>> ListAsync(CancellationToken cancellationToken)
    {
        await using var session = store.QuerySession();

        var captured = await session.Events
            .QueryRawEventDataOnly<AsxFuturesDealCaptured>()
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return
        [
            .. captured
                .OrderByDescending(deal => deal.OccurredAt)
                .Select(AsxFuturesDealResponse.From)
        ];
    }

    public async Task<AsxFuturesDealResponse?> FindAsync(Guid dealId, CancellationToken cancellationToken)
    {
        await using var session = store.QuerySession();

        var stream = await session.Events.FetchStreamAsync(dealId, token: cancellationToken).ConfigureAwait(false);
        var captured = stream.Select(@event => @event.Data).OfType<AsxFuturesDealCaptured>().FirstOrDefault();

        return captured is null ? null : AsxFuturesDealResponse.From(captured);
    }
}
