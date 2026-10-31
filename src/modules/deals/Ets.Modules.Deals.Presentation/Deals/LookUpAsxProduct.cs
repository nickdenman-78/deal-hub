using Ets.Core.Domain.CQRS;
using Ets.Core.Presentation.Endpoints;
using Ets.Core.Presentation.Results;
using Ets.Modules.Deals.Application.Deals;
using Ets.Modules.Deals.Application.Deals.LookUpAsxProduct;
using JetBrains.Annotations;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Ets.Modules.Deals.Presentation.Deals;

/// <summary>
///     <c>GET /api/deals/asx-products/{productCode}</c>: what an ASX product code trades, and whether ASX lists it.
/// </summary>
[UsedImplicitly]
internal sealed class LookUpAsxProduct : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("/asx-products/{productCode}", HandleAsync)
            .RequirePolicy(app.Policies().Read)
            .WithName(nameof(LookUpAsxProduct))
            .WithSummary("Look up an ASX product code")
            .WithDescription(
                "Decodes an ASX product code (such as BNH27) into region, load profile, payoff and term, and looks " +
                "it up in the ASX product catalogue. A code ASX does not list is returned with listed false and no " +
                "contract size; a code that does not decode is a validation problem.")
            .Produces<AsxProductResponse>()
            .ProducesValidationProblem();
    }

    private static async Task<IResult> HandleAsync(
        string productCode,
        IQueryHandler<LookUpAsxProductQuery, AsxProductResponse> handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new LookUpAsxProductQuery(productCode), cancellationToken)
            .ConfigureAwait(false);

        return result.Match(Results.Ok, ApiResults.Problem);
    }
}
