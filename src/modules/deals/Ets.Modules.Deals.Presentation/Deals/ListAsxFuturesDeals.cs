using Ets.Core.Domain.CQRS;
using Ets.Core.Presentation.Endpoints;
using Ets.Core.Presentation.Results;
using Ets.Modules.Deals.Application.Deals;
using Ets.Modules.Deals.Application.Deals.ListAsxFuturesDeals;
using JetBrains.Annotations;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Ets.Modules.Deals.Presentation.Deals;

/// <summary><c>GET /api/deals</c>: every ASX futures deal, most recently captured first.</summary>
[UsedImplicitly]
internal sealed class ListAsxFuturesDeals : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet(string.Empty, HandleAsync)
            .RequirePolicy(app.Policies().Read)
            .WithName(nameof(ListAsxFuturesDeals))
            .WithSummary("List ASX futures deals")
            .WithDescription(
                "Every ASX futures deal, most recently captured first, with the ASX product as it stood when the " +
                "deal was captured.")
            .Produces<IReadOnlyList<AsxFuturesDealResponse>>();
    }

    private static async Task<IResult> HandleAsync(
        IQueryHandler<ListAsxFuturesDealsQuery, IReadOnlyList<AsxFuturesDealResponse>> handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new ListAsxFuturesDealsQuery(), cancellationToken)
            .ConfigureAwait(false);

        return result.Match(Results.Ok, ApiResults.Problem);
    }
}
