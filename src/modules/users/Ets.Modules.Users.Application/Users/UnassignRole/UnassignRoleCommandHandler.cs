using Ets.Core.Domain.CQRS;
using Ets.Core.Domain.Models;
using Ets.Core.Domain.Services;
using Ets.Modules.Users.Domain.Repositories;
using Ets.Modules.Users.Domain.ValueObjects;

namespace Ets.Modules.Users.Application.Users.UnassignRole;

/// <summary>
///     Takes the role away and saves. The user loses the role's permissions from their next request.
/// </summary>
[UsedImplicitly]
internal sealed class UnassignRoleCommandHandler(
    IUserRepository users,
    IUsersUnitOfWork unitOfWork,
    IDateTimeProvider clock) : ICommandHandler<UnassignRoleCommand>
{
    public async Task<Result> HandleAsync(UnassignRoleCommand command, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);

        var user = await users.FindAsync(new UserId(command.UserId), cancellationToken).ConfigureAwait(false);

        if (user is null)
        {
            return Result.Failure(UserErrors.NotFound(command.UserId));
        }

        var unassigned = user.UnassignRole(new RoleId(command.RoleId), clock);

        if (unassigned.IsFailure)
        {
            return unassigned;
        }

        return await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }
}
