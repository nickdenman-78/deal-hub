using Ets.Core.Domain.CQRS;
using Ets.Core.Domain.Models;
using Ets.Core.Domain.Services;
using Ets.Modules.Users.Domain.Models;
using Ets.Modules.Users.Domain.Repositories;
using Ets.Modules.Users.Domain.ValueObjects;

namespace Ets.Modules.Users.Application.Users.RegisterUser;

/// <summary>
///     Registers the user unless their identity already is. The unique index on the identity catches a
///     registration made by someone else in the meantime, as a save conflict.
/// </summary>
[UsedImplicitly]
internal sealed class RegisterUserCommandHandler(
    IUserRepository users,
    IUsersUnitOfWork unitOfWork,
    IIdGenerator ids,
    IDateTimeProvider clock) : ICommandHandler<RegisterUserCommand, Guid>
{
    public async Task<Result<Guid>> HandleAsync(RegisterUserCommand command, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);

        var identityId = IdentityId.Create(command.IdentityId);

        if (identityId.IsFailure)
        {
            return Result.Failure<Guid>(identityId.Error!);
        }

        if (await users.FindByIdentityAsync(identityId.Value, cancellationToken).ConfigureAwait(false) is not null)
        {
            return Result.Failure<Guid>(UserErrors.IdentityTaken(identityId.Value));
        }

        var user = User.Register(identityId.Value, command.UserName, ids, clock);

        if (user.IsFailure)
        {
            return Result.Failure<Guid>(user.Error!);
        }

        users.Add(user.Value);

        var saved = await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return saved.IsFailure
            ? Result.Failure<Guid>(saved.Error!)
            : user.Value.Id.Value;
    }
}
