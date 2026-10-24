using Ets.Core.Domain.CQRS;
using Ets.Core.Presentation.Endpoints;
using Ets.Core.Presentation.Results;
using Ets.Modules.Users.Application.Roles.CreateRole;
using JetBrains.Annotations;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Ets.Modules.Users.Presentation.Roles;

/// <summary><c>POST /api/users/roles</c>: creates a role granting a set of permissions.</summary>
[UsedImplicitly]
internal sealed class CreateRole : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("/roles", HandleAsync)
            .RequirePolicy(app.Policies().Manage)
            .WithTags(Tags.Roles)
            .WithName(nameof(CreateRole))
            .WithSummary("Create a role")
            .WithDescription(
                "Creates a role with a unique name, granting permissions written module:action (such as " +
                "deals:capture).")
            .Produces<CreateRoleResponse>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status409Conflict);
    }

    private static async Task<IResult> HandleAsync(
        CreateRoleRequest request,
        ICommandHandler<CreateRoleCommand, Guid> handler,
        CancellationToken cancellationToken)
    {
        // A missing list is passed on as missing, so the validator reports it with the other fields.
        var command = new CreateRoleCommand(request.Name ?? string.Empty, request.Permissions!);

        var result = await handler.HandleAsync(command, cancellationToken).ConfigureAwait(false);

        return result.Match(
            id => Results.Created($"/api/users/roles/{id}", new CreateRoleResponse(id)),
            ApiResults.Problem);
    }
}
