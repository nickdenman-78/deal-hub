using Ets.Core.Domain.CQRS;
using Ets.Core.Domain.Models;
using Ets.Modules.Users.Domain.Repositories;

namespace Ets.Modules.Users.Application.Users.ListUsers;

/// <summary>Reads every user, and every role once for the role names.</summary>
[UsedImplicitly]
internal sealed class ListUsersQueryHandler(IUserRepository users, IRoleRepository roles)
    : IQueryHandler<ListUsersQuery, IReadOnlyList<UserResponse>>
{
    public async Task<Result<IReadOnlyList<UserResponse>>> HandleAsync(
        ListUsersQuery query,
        CancellationToken cancellationToken)
    {
        var all = await users.ListAsync(cancellationToken).ConfigureAwait(false);
        var roleNames = (await roles.ListAsync(cancellationToken).ConfigureAwait(false))
            .ToDictionary(role => role.Id, role => role.Name.Value);

        return Result.Success<IReadOnlyList<UserResponse>>([.. all.Select(user => UserResponse.From(user, roleNames))]);
    }
}
