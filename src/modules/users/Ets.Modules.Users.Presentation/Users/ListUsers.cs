using Ets.Core.Domain.CQRS;
using Ets.Core.Presentation.Endpoints;
using Ets.Core.Presentation.Results;
using Ets.Modules.Users.Application.Users;
using Ets.Modules.Users.Application.Users.ListUsers;
using JetBrains.Annotations;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Ets.Modules.Users.Presentation.Users;

/// <summary><c>GET /api/users</c>: every registered user and the roles they hold.</summary>
[UsedImplicitly]
internal sealed class ListUsers : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet(string.Empty, HandleAsync)
            .RequirePolicy(app.Policies().Read)
            .WithName(nameof(ListUsers))
            .WithSummary("List users")
            .WithDescription("Every registered user, ordered by user name, with the roles they hold.")
            .Produces<IReadOnlyList<UserResponse>>();
    }

    private static async Task<IResult> HandleAsync(
        IQueryHandler<ListUsersQuery, IReadOnlyList<UserResponse>> handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new ListUsersQuery(), cancellationToken).ConfigureAwait(false);

        return result.Match(Results.Ok, ApiResults.Problem);
    }
}
