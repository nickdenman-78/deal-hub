using Ets.Modules.Deals.Domain.Models;
using Marten;

namespace Ets.Modules.Deals.Infrastructure.EventStore;

/// <summary>
///     One request's Marten session on <see cref="IDealsStore" />, and the deals the request has added or
///     loaded. The repository tracks deals here; the unit of work appends their events and saves.
/// </summary>
/// <remarks>Scoped, so the repository and the unit of work of one request share it.</remarks>
internal sealed class DealsEventSession(IDealsStore store) : IDisposable, IAsyncDisposable
{
    private readonly List<ExchangeDeal> _deals = [];

    private IDocumentSession? _session;

    /// <summary>The deals this request has touched, in the order it touched them.</summary>
    public IReadOnlyList<ExchangeDeal> Deals => _deals.AsReadOnly();

    /// <summary>The Marten session, opened on first use.</summary>
    public IDocumentSession Session => _session ??= store.LightweightSession();

    public void Track(ExchangeDeal deal)
    {
        ArgumentNullException.ThrowIfNull(deal);

        if (!_deals.Contains(deal))
        {
            _deals.Add(deal);
        }
    }

    public void Dispose()
    {
        _session?.Dispose();
    }

    public async ValueTask DisposeAsync()
    {
        if (_session is not null)
        {
            await _session.DisposeAsync().ConfigureAwait(false);
        }
    }
}
