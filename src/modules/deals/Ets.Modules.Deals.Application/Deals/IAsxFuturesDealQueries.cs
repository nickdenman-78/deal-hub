namespace Ets.Modules.Deals.Application.Deals;

/// <summary>
///     The read side of ASX futures deals: what the deal list and the deal details show. Reads never load
///     aggregates; the event store implements this port in Infrastructure.
/// </summary>
public interface IAsxFuturesDealQueries
{
    /// <summary>Every ASX futures deal, most recently captured first.</summary>
    Task<IReadOnlyList<AsxFuturesDealResponse>> ListAsync(CancellationToken cancellationToken);

    /// <summary>One deal, or <c>null</c> when there is no ASX futures deal with that id.</summary>
    Task<AsxFuturesDealResponse?> FindAsync(Guid dealId, CancellationToken cancellationToken);
}
