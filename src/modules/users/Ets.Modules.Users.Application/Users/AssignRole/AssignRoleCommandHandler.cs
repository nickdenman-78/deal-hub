using Ets.Core.Domain.CQRS;
using Ets.Core.Domain.Models;
using Ets.Core.Domain.Services;
using Ets.Modules.Users.Application.Roles;
using Ets.Modules.Users.Domain.Repositories;
using Ets.Modules.Users.Domain.ValueObjects;

namespace Ets.Modules.Users.Application.Users.AssignRole;

/// <summary>
///     Checks the role exists, assigns it and saves. The user has the role's permissions from their next
///     request, since permission claims are read per request.
/// </summary>
[UsedImplicitly]
internal sealed class AssignRoleCommandHandler(
    IUserRepository users,
    IRoleRepository roles,
    IUsersUnitOfWork unitOfWork,
    IDateTimeProvider clock) : ICommandHandler<AssignRoleCommand>
{
    public async Task<Result> HandleAsync(AssignRoleCommand command, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);

        var user = await users.FindAsync(new UserId(command.UserId), cancellationToken).ConfigureAwait(false);

        if (user is null)
        {
            return Result.Failure(UserErrors.NotFound(command.UserId));
        }

        // The user holds only a role id, so the role is checked here; the database's foreign key would
        // otherwise turn a stale id into a server error.
        var role = await roles.FindAsync(new RoleId(command.RoleId), cancellationToken).ConfigureAwait(false);

        if (role is null)
        {
            return Result.Failure(RoleErrors.NotFound(command.RoleId));
        }

        var assigned = user.AssignRole(role.Id, clock);

        if (assigned.IsFailure)
        {
            return assigned;
        }

        return await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }
}
