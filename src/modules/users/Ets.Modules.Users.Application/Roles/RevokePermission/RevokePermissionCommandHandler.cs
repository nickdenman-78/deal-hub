using Ets.Core.Domain.CQRS;
using Ets.Core.Domain.Models;
using Ets.Core.Domain.Services;
using Ets.Modules.Users.Domain.Repositories;
using Ets.Modules.Users.Domain.ValueObjects;

namespace Ets.Modules.Users.Application.Roles.RevokePermission;

/// <summary>
///     Loads the role, revokes the permission and saves. Everyone holding the role has it revoked from their
///     next request, since permission claims are read per request.
/// </summary>
[UsedImplicitly]
internal sealed class RevokePermissionCommandHandler(
    IRoleRepository roles,
    IUsersUnitOfWork unitOfWork,
    IDateTimeProvider clock) : ICommandHandler<RevokePermissionCommand>
{
    public async Task<Result> HandleAsync(RevokePermissionCommand command, CancellationToken cancellationToken)
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

        var revoked = role.Revoke(permission.Value, clock);

        if (revoked.IsFailure)
        {
            return revoked;
        }

        return await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }
}
