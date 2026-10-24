using Ets.Core.Domain.CQRS;
using Ets.Core.Domain.ValueObjects;
using Ets.Core.Presentation.Endpoints;
using Ets.Core.Presentation.Results;
using Ets.Modules.Deals.Application.Deals.CaptureAsxFuturesDeal;
using Ets.Modules.Deals.Domain.ValueObjects;
using JetBrains.Annotations;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Ets.Modules.Deals.Presentation.Deals;

/// <summary>
///     <c>POST /api/deals/asx-futures</c>: captures an ASX futures deal from the trader's quote.
/// </summary>
[UsedImplicitly]
internal sealed class CaptureAsxFuturesDeal : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("/asx-futures", HandleAsync)
            .RequirePolicy(app.Policies().Capture)
            .WithName(nameof(CaptureAsxFuturesDeal))
            .WithSummary("Capture an ASX futures deal")
            .WithDescription(
                "Captures a deal from an ASX product code (such as BNH26), direction, price in $/MWh and volume " +
                "in lots (MW). The product must be in the ASX product catalogue.")
            .Produces<CaptureAsxFuturesDealResponse>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict);
    }

    private static async Task<IResult> HandleAsync(
        CaptureAsxFuturesDealRequest request,
        ICommandHandler<CaptureAsxFuturesDealCommand, Guid> handler,
        CancellationToken cancellationToken)
    {
        // An unrecognised direction is passed on as missing, so the validator reports it with the other fields.
        var direction = TradeDirection.TryParse(request.Direction, out var parsed) ? parsed : null;

        var command = new CaptureAsxFuturesDealCommand(
            request.ProductCode ?? string.Empty,
            direction!,
            Amount.Create(request.Price, AmountUnit.DollarPerMWh),
            Volume.Create(request.Volume, VolumeUnit.MW));

        var result = await handler.HandleAsync(command, cancellationToken).ConfigureAwait(false);

        return result.Match(
            id => Results.Created($"/api/deals/{id}", new CaptureAsxFuturesDealResponse(id)),
            ApiResults.Problem);
    }
}
