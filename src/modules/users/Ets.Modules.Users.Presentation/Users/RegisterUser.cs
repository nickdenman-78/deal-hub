using Ets.Core.Domain.CQRS;
using Ets.Core.Presentation.Endpoints;
using Ets.Core.Presentation.Results;
using Ets.Modules.Users.Application.Users.RegisterUser;
using JetBrains.Annotations;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Ets.Modules.Users.Presentation.Users;

/// <summary><c>POST /api/users</c>: registers a Keycloak identity as an ETS user.</summary>
[UsedImplicitly]
internal sealed class RegisterUser : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost(string.Empty, HandleAsync)
            .RequirePolicy(app.Policies().Manage)
            .WithName(nameof(RegisterUser))
            .WithSummary("Register a user")
            .WithDescription(
                "Registers a person who already exists in Keycloak, holding no roles. Their identity id is the " +
                "token's sub claim, which GET /api/me returns as identityId.")
            .Produces<RegisterUserResponse>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status409Conflict);
    }

    private static async Task<IResult> HandleAsync(
        RegisterUserRequest request,
        ICommandHandler<RegisterUserCommand, Guid> handler,
        CancellationToken cancellationToken)
    {
        var command = new RegisterUserCommand(request.IdentityId ?? string.Empty, request.UserName ?? string.Empty);

        var result = await handler.HandleAsync(command, cancellationToken).ConfigureAwait(false);

        return result.Match(
            id => Results.Created($"/api/users/{id}", new RegisterUserResponse(id)),
            ApiResults.Problem);
    }
}
