namespace Ets.Modules.Deals.Application.Deals;

/// <summary>
///     Tells connected screens that deals have changed, so they reload what they show. The read model calls it
///     after it has written the deals, so a screen that reloads on the notice sees the change.
/// </summary>
/// <remarks>
///     A notice carries ids only, never deal data: each screen reads the deals through the normal, authorized
///     queries. Delivery is best effort; a screen that misses one catches up on its next reload.
/// </remarks>
public interface IDealsChangedNotifier
{
    /// <summary>Announces that the deals with these ids were created or changed.</summary>
    Task DealsChangedAsync(IReadOnlyCollection<Guid> dealIds, CancellationToken cancellationToken);
}
