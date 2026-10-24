using Ets.Core.Domain.CQRS;
using Ets.Core.Presentation.Endpoints;
using Ets.Core.Presentation.Results;
using Ets.Modules.Users.Application.Roles;
using Ets.Modules.Users.Application.Roles.GetRole;
using JetBrains.Annotations;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Ets.Modules.Users.Presentation.Roles;

/// <summary><c>GET /api/users/roles/{roleId}</c>: one role and the permissions it grants.</summary>
[UsedImplicitly]
internal sealed class GetRole : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("/roles/{roleId:guid}", HandleAsync)
            .RequirePolicy(app.Policies().Read)
            .WithTags(Tags.Roles)
            .WithName(nameof(GetRole))
            .WithSummary("Get a role")
            .WithDescription("One role, with the permissions it grants.")
            .Produces<RoleResponse>()
            .ProducesProblem(StatusCodes.Status404NotFound);
    }

    private static async Task<IResult> HandleAsync(
        Guid roleId,
        IQueryHandler<GetRoleQuery, RoleResponse> handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new GetRoleQuery(roleId), cancellationToken).ConfigureAwait(false);

        return result.Match(Results.Ok, ApiResults.Problem);
    }
}
