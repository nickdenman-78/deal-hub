using Ets.Core.Domain.CQRS;
using Ets.Core.Domain.Models;
using Ets.Core.Domain.Services;
using Ets.Modules.Users.Domain.Repositories;
using Ets.Modules.Users.Domain.ValueObjects;

namespace Ets.Modules.Users.Application.Roles.GrantPermission;

/// <summary>
///     Loads the role, grants the permission and saves. Everyone holding the role has it granted from their
///     next request, since permission claims are read per request.
/// </summary>
[UsedImplicitly]
internal sealed class GrantPermissionCommandHandler(
    IRoleRepository roles,
    IUsersUnitOfWork unitOfWork,
    IDateTimeProvider clock) : ICommandHandler<GrantPermissionCommand>
{
    public async Task<Result> HandleAsync(GrantPermissionCommand command, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);

        var permission = Permission.Create(command.Permission);

        if (permission.IsFailure)
        {
            return Result.Failure(permission.Error!);
        }

        var role = await roles.FindAsync(new RoleId(command.RoleId), cancellationToken).ConfigureAwait(false);

        if (role is null)
        {
            return Result.Failure(RoleErrors.NotFound(command.RoleId));
        }

        var granted = role.Grant(permission.Value, clock);

        if (granted.IsFailure)
        {
            return granted;
        }

        return await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }
}
