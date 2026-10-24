using Ets.Core.Domain.Models;
using Ets.Core.Domain.Services;
using Ets.Modules.Users.Domain.Events;
using Ets.Modules.Users.Domain.ValueObjects;

namespace Ets.Modules.Users.Domain.Models;

/// <summary>
///     A named set of permissions given to people who do the same job, such as Trader.
/// </summary>
/// <remarks>
///     Invariants:
///     <list type="bullet">
///         <item>the name is not blank (<see cref="RoleName" />), and no two roles share a name (the repository's
///         unique name);</item>
///         <item>a permission is granted to a role at most once.</item>
///     </list>
/// </remarks>
public sealed class Role : AggregateRoot<RoleId>
{
    public const string AlreadyGrantedErrorCode = "role.permission.already-granted";
    public const string NotGrantedErrorCode = "role.permission.not-granted";

    private readonly List<Permission> _permissions = [];

    // For EF Core: a role is created by Create.
    private Role()
    {
    }

    private Role(RoleId id, RoleName name) : base(id)
    {
        Name = name;
    }

    [UsedImplicitly] public RoleName Name { get; private set; } = null!;

    /// <summary>The permissions this role grants, in the order they were granted.</summary>
    public IReadOnlyList<Permission> Permissions => _permissions.AsReadOnly();

    /// <summary>Creates a role granting <paramref name="permissions" /> and raises <see cref="RoleCreated" />.</summary>
    /// <remarks>A permission listed twice is granted once.</remarks>
    public static Role Create(
        RoleName name,
        IEnumerable<Permission> permissions,
        IIdGenerator ids,
        IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(name);
        ArgumentNullException.ThrowIfNull(permissions);
        ArgumentNullException.ThrowIfNull(ids);
        ArgumentNullException.ThrowIfNull(clock);

        var role = new Role(new RoleId(ids.NewId()), name);
        role._permissions.AddRange(permissions.Distinct());
        role.Raise(new RoleCreated(role.Id, name, [.. role._permissions], clock.Now));

        return role;
    }

    /// <summary>Grants <paramref name="permission" /> and raises <see cref="PermissionGranted" />.</summary>
    public Result Grant(Permission permission, IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(permission);
        ArgumentNullException.ThrowIfNull(clock);

        if (_permissions.Contains(permission))
        {
            return Result.Failure(DomainError.Conflict(
                AlreadyGrantedErrorCode,
                $"{Name} already grants {permission}."));
        }

        _permissions.Add(permission);
        Raise(new PermissionGranted(Id, permission, clock.Now));

        return Result.Success();
    }

    /// <summary>Revokes <paramref name="permission" /> and raises <see cref="PermissionRevoked" />.</summary>
    public Result Revoke(Permission permission, IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(permission);
        ArgumentNullException.ThrowIfNull(clock);

        if (!_permissions.Remove(permission))
        {
            return Result.Failure(DomainError.Conflict(
                NotGrantedErrorCode,
                $"{Name} does not grant {permission}."));
        }

        Raise(new PermissionRevoked(Id, permission, clock.Now));

        return Result.Success();
    }
}
