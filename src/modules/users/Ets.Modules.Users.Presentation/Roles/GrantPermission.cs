using Ets.Core.Domain.CQRS;
using Ets.Core.Presentation.Endpoints;
using Ets.Core.Presentation.Results;
using Ets.Modules.Users.Application.Roles.GrantPermission;
using JetBrains.Annotations;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Ets.Modules.Users.Presentation.Roles;

/// <summary><c>POST /api/users/roles/{roleId}/permissions</c>: grants a role one more permission.</summary>
[UsedImplicitly]
internal sealed class GrantPermission : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("/roles/{roleId:guid}/permissions", HandleAsync)
            .RequirePolicy(app.Policies().Manage)
            .WithTags(Tags.Roles)
            .WithName(nameof(GrantPermission))
            .WithSummary("Grant a permission to a role")
            .WithDescription("Everyone holding the role has the permission from their next request.")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict);
    }

    private static async Task<IResult> HandleAsync(
        Guid roleId,
        GrantPermissionRequest request,
        ICommandHandler<GrantPermissionCommand> handler,
        CancellationToken cancellationToken)
    {
        var command = new GrantPermissionCommand(roleId, request.Permission ?? string.Empty);

        var result = await handler.HandleAsync(command, cancellationToken).ConfigureAwait(false);

        return result.Match(Results.NoContent, ApiResults.Problem);
    }
}
