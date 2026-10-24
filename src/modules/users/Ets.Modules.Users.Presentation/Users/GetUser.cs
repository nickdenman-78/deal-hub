using Ets.Core.Domain.CQRS;
using Ets.Core.Presentation.Endpoints;
using Ets.Core.Presentation.Results;
using Ets.Modules.Users.Application.Users;
using Ets.Modules.Users.Application.Users.GetUser;
using JetBrains.Annotations;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Ets.Modules.Users.Presentation.Users;

/// <summary><c>GET /api/users/{userId}</c>: one user and the roles they hold.</summary>
[UsedImplicitly]
internal sealed class GetUser : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("/{userId:guid}", HandleAsync)
            .RequirePolicy(app.Policies().Read)
            .WithName(nameof(GetUser))
            .WithSummary("Get a user")
            .WithDescription("One user, with the roles they hold.")
            .Produces<UserResponse>()
            .ProducesProblem(StatusCodes.Status404NotFound);
    }

    private static async Task<IResult> HandleAsync(
        Guid userId,
        IQueryHandler<GetUserQuery, UserResponse> handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new GetUserQuery(userId), cancellationToken).ConfigureAwait(false);

        return result.Match(Results.Ok, ApiResults.Problem);
    }
}
