using Ets.Core.Domain.CQRS;
using Ets.Core.Presentation.Endpoints;
using Ets.Core.Presentation.Results;
using Ets.Modules.Users.Application.Roles.RevokePermission;
using JetBrains.Annotations;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Ets.Modules.Users.Presentation.Roles;

/// <summary><c>DELETE /api/users/roles/{roleId}/permissions/{permission}</c>: revokes a permission from a role.</summary>
[UsedImplicitly]
internal sealed class RevokePermission : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapDelete("/roles/{roleId:guid}/permissions/{permission}", HandleAsync)
            .RequirePolicy(app.Policies().Manage)
            .WithTags(Tags.Roles)
            .WithName(nameof(RevokePermission))
            .WithSummary("Revoke a permission from a role")
            .WithDescription("Everyone holding the role loses the permission from their next request.")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict);
    }

    private static async Task<IResult> HandleAsync(
        Guid roleId,
        string permission,
        ICommandHandler<RevokePermissionCommand> handler,
        CancellationToken cancellationToken)
    {
        var command = new RevokePermissionCommand(roleId, permission);

        var result = await handler.HandleAsync(command, cancellationToken).ConfigureAwait(false);

        return result.Match(Results.NoContent, ApiResults.Problem);
    }
}
