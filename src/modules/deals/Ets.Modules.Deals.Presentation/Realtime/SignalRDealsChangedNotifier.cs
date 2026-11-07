using Ets.Modules.Deals.Application.Deals;
using Microsoft.AspNetCore.SignalR;

namespace Ets.Modules.Deals.Presentation.Realtime;

/// <summary>Sends deal change notices to every screen connected to <see cref="DealsHub" />.</summary>
internal sealed class SignalRDealsChangedNotifier(IHubContext<DealsHub> hub) : IDealsChangedNotifier
{
    public Task DealsChangedAsync(IReadOnlyCollection<Guid> dealIds, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(dealIds);

        return dealIds.Count == 0
            ? Task.CompletedTask
            : hub.Clients.All.SendAsync(DealsHubMessages.DealsChanged, new { dealIds }, cancellationToken);
    }
}
