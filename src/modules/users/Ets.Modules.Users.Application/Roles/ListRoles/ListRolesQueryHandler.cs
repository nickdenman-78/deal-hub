using Ets.Core.Domain.CQRS;
using Ets.Core.Domain.Models;
using Ets.Modules.Users.Domain.Repositories;

namespace Ets.Modules.Users.Application.Roles.ListRoles;

[UsedImplicitly]
internal sealed class ListRolesQueryHandler(IRoleRepository roles) : IQueryHandler<ListRolesQuery, IReadOnlyList<RoleResponse>>
{
    public async Task<Result<IReadOnlyList<RoleResponse>>> HandleAsync(
        ListRolesQuery query,
        CancellationToken cancellationToken)
    {
        var all = await roles.ListAsync(cancellationToken).ConfigureAwait(false);

        return Result.Success<IReadOnlyList<RoleResponse>>([.. all.Select(RoleResponse.From)]);
    }
}
