using Ets.Core.Domain.CQRS;
using Ets.Core.Domain.Models;
using Ets.Modules.Users.Domain.Repositories;
using Ets.Modules.Users.Domain.ValueObjects;

namespace Ets.Modules.Users.Application.Users.GetUser;

[UsedImplicitly]
internal sealed class GetUserQueryHandler(IUserRepository users, IRoleRepository roles)
    : IQueryHandler<GetUserQuery, UserResponse>
{
    public async Task<Result<UserResponse>> HandleAsync(GetUserQuery query, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(query);

        var user = await users.FindAsync(new UserId(query.UserId), cancellationToken).ConfigureAwait(false);

        if (user is null)
        {
            return Result.Failure<UserResponse>(UserErrors.NotFound(query.UserId));
        }

        var roleNames = (await roles.ListAsync(cancellationToken).ConfigureAwait(false))
            .ToDictionary(role => role.Id, role => role.Name.Value);

        return UserResponse.From(user, roleNames);
    }
}
