using Ets.Core.Domain.CQRS;
using Ets.Core.Presentation.Endpoints;
using Ets.Core.Presentation.Results;
using Ets.Modules.Users.Application.Roles;
using Ets.Modules.Users.Application.Roles.ListRoles;
using JetBrains.Annotations;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Ets.Modules.Users.Presentation.Roles;

/// <summary><c>GET /api/users/roles</c>: every role and the permissions it grants.</summary>
[UsedImplicitly]
internal sealed class ListRoles : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("/roles", HandleAsync)
            .RequirePolicy(app.Policies().Read)
            .WithTags(Tags.Roles)
            .WithName(nameof(ListRoles))
            .WithSummary("List roles")
            .WithDescription("Every role, ordered by name, with the permissions it grants.")
            .Produces<IReadOnlyList<RoleResponse>>();
    }

    private static async Task<IResult> HandleAsync(
        IQueryHandler<ListRolesQuery, IReadOnlyList<RoleResponse>> handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new ListRolesQuery(), cancellationToken).ConfigureAwait(false);

        return result.Match(Results.Ok, ApiResults.Problem);
    }
}
