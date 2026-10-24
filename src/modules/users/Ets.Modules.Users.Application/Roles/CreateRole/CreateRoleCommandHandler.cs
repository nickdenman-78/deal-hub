using Ets.Core.Domain.CQRS;
using Ets.Core.Domain.Models;
using Ets.Core.Domain.Services;
using Ets.Modules.Users.Domain.Models;
using Ets.Modules.Users.Domain.Repositories;
using Ets.Modules.Users.Domain.ValueObjects;

namespace Ets.Modules.Users.Application.Roles.CreateRole;

/// <summary>
///     Creates the role unless another already has its name. The unique index on the name catches a role
///     created by someone else in the meantime, as a save conflict.
/// </summary>
[UsedImplicitly]
internal sealed class CreateRoleCommandHandler(
    IRoleRepository roles,
    IUsersUnitOfWork unitOfWork,
    IIdGenerator ids,
    IDateTimeProvider clock) : ICommandHandler<CreateRoleCommand, Guid>
{
    public async Task<Result<Guid>> HandleAsync(CreateRoleCommand command, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);

        var name = RoleName.Create(command.Name);

        if (name.IsFailure)
        {
            return Result.Failure<Guid>(name.Error!);
        }

        List<Permission> permissions = [];

        foreach (string value in command.Permissions)
        {
            var permission = Permission.Create(value);

            if (permission.IsFailure)
            {
                return Result.Failure<Guid>(permission.Error!);
            }

            permissions.Add(permission.Value);
        }

        if (await roles.FindByNameAsync(name.Value, cancellationToken).ConfigureAwait(false) is not null)
        {
            return Result.Failure<Guid>(RoleErrors.NameTaken(name.Value));
        }

        var role = Role.Create(name.Value, permissions, ids, clock);
        roles.Add(role);

        var saved = await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return saved.IsFailure
            ? Result.Failure<Guid>(saved.Error!)
            : role.Id.Value;
    }
}
