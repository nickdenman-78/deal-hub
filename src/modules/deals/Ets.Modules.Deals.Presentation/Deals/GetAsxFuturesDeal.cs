using Ets.Core.Domain.CQRS;
using Ets.Core.Presentation.Endpoints;
using Ets.Core.Presentation.Results;
using Ets.Modules.Deals.Application.Deals;
using Ets.Modules.Deals.Application.Deals.GetAsxFuturesDeal;
using JetBrains.Annotations;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Ets.Modules.Deals.Presentation.Deals;

/// <summary><c>GET /api/deals/{dealId}</c>: one ASX futures deal.</summary>
[UsedImplicitly]
internal sealed class GetAsxFuturesDeal : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("/{dealId:guid}", HandleAsync)
            .RequirePolicy(app.Policies().Read)
            .WithName(nameof(GetAsxFuturesDeal))
            .WithSummary("Get an ASX futures deal")
            .WithDescription("One ASX futures deal, with the ASX product as it stood when the deal was captured.")
            .Produces<AsxFuturesDealResponse>()
            .ProducesProblem(StatusCodes.Status404NotFound);
    }

    private static async Task<IResult> HandleAsync(
        Guid dealId,
        IQueryHandler<GetAsxFuturesDealQuery, AsxFuturesDealResponse> handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new GetAsxFuturesDealQuery(dealId), cancellationToken)
            .ConfigureAwait(false);

        return result.Match(Results.Ok, ApiResults.Problem);
    }
}
