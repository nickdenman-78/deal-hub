using Ets.Core.Domain.CQRS;
using Ets.Core.Presentation.Endpoints;
using Ets.Core.Presentation.Results;
using Ets.Modules.Users.Application.Users.AssignRole;
using JetBrains.Annotations;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Ets.Modules.Users.Presentation.Users;

/// <summary><c>POST /api/users/{userId}/roles</c>: gives a user a role.</summary>
[UsedImplicitly]
internal sealed class AssignRole : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("/{userId:guid}/roles", HandleAsync)
            .RequirePolicy(app.Policies().Manage)
            .WithName(nameof(AssignRole))
            .WithSummary("Assign a role to a user")
            .WithDescription("The user has the role's permissions from their next request.")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict);
    }

    private static async Task<IResult> HandleAsync(
        Guid userId,
        AssignRoleRequest request,
        ICommandHandler<AssignRoleCommand> handler,
        CancellationToken cancellationToken)
    {
        // A missing role id is passed on as empty, so the validator reports it.
        var command = new AssignRoleCommand(userId, request.RoleId ?? Guid.Empty);

        var result = await handler.HandleAsync(command, cancellationToken).ConfigureAwait(false);

        return result.Match(Results.NoContent, ApiResults.Problem);
    }
}
