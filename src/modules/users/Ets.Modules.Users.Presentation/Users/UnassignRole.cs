using Ets.Core.Domain.CQRS;
using Ets.Core.Presentation.Endpoints;
using Ets.Core.Presentation.Results;
using Ets.Modules.Users.Application.Users.UnassignRole;
using JetBrains.Annotations;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Ets.Modules.Users.Presentation.Users;

/// <summary><c>DELETE /api/users/{userId}/roles/{roleId}</c>: takes a role away from a user.</summary>
[UsedImplicitly]
internal sealed class UnassignRole : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapDelete("/{userId:guid}/roles/{roleId:guid}", HandleAsync)
            .RequirePolicy(app.Policies().Manage)
            .WithName(nameof(UnassignRole))
            .WithSummary("Unassign a role from a user")
            .WithDescription("The user loses the role's permissions from their next request.")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict);
    }

    private static async Task<IResult> HandleAsync(
        Guid userId,
        Guid roleId,
        ICommandHandler<UnassignRoleCommand> handler,
        CancellationToken cancellationToken)
    {
        var command = new UnassignRoleCommand(userId, roleId);

        var result = await handler.HandleAsync(command, cancellationToken).ConfigureAwait(false);

        return result.Match(Results.NoContent, ApiResults.Problem);
    }
}
