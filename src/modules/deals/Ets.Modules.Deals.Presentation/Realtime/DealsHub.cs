using Microsoft.AspNetCore.SignalR;

namespace Ets.Modules.Deals.Presentation.Realtime;

/// <summary>
///     The Deals module's SignalR hub, at <c>/api/deals/hub</c>. Server to client only: screens connect to hear
///     <see cref="DealsHubMessages.DealsChanged" /> and then reload through the normal endpoints.
/// </summary>
/// <remarks>
///     Connecting needs the same policy as reading deals, so a notice only reaches callers who may read them.
/// </remarks>
internal sealed class DealsHub : Hub;

/// <summary>The client methods the hub invokes, named once so server and SPA agree.</summary>
internal static class DealsHubMessages
{
    /// <summary>Payload <c>{ dealIds: string[] }</c>: deals that were created or changed.</summary>
    public const string DealsChanged = "dealsChanged";
}
