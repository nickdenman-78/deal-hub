using Ets.Core.Domain.CQRS;
using Ets.Core.Domain.Models;
using Ets.Modules.Users.Domain.Repositories;
using Ets.Modules.Users.Domain.ValueObjects;

namespace Ets.Modules.Users.Application.Roles.GetRole;

[UsedImplicitly]
internal sealed class GetRoleQueryHandler(IRoleRepository roles) : IQueryHandler<GetRoleQuery, RoleResponse>
{
    public async Task<Result<RoleResponse>> HandleAsync(GetRoleQuery query, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(query);

        var role = await roles.FindAsync(new RoleId(query.RoleId), cancellationToken).ConfigureAwait(false);

        return role is null
            ? Result.Failure<RoleResponse>(RoleErrors.NotFound(query.RoleId))
            : RoleResponse.From(role);
    }
}
