using Ets.Core.Domain.Models;
using Ets.Core.Domain.Services;
using Ets.Modules.Users.Domain.Events;
using Ets.Modules.Users.Domain.ValueObjects;

namespace Ets.Modules.Users.Domain.Models;

/// <summary>
///     A person who uses ETS, known by their Keycloak identity. What they may do is the union of the
///     permissions their roles grant.
/// </summary>
/// <remarks>
///     Invariants:
///     <list type="bullet">
///         <item>no two users share an identity (the repository's unique identity id);</item>
///         <item>a role is assigned to a user at most once.</item>
///     </list>
///     Registering a user does not create their sign-in; Keycloak owns credentials (ADR-0006).
/// </remarks>
public sealed class User : AggregateRoot<UserId>
{
    public const string AlreadyAssignedErrorCode = "user.role.already-assigned";
    public const string NotAssignedErrorCode = "user.role.not-assigned";
    public const string UserNameInvalidErrorCode = "user.user-name.invalid";

    /// <summary>The longest user name stored, matching Keycloak's limit.</summary>
    public const int MaxLengthUserName = 255;

    private readonly List<RoleAssignment> _roleAssignments = [];

    // For EF Core: a user is created by Register.
    private User()
    {
    }

    private User(UserId id, IdentityId identityId, string userName) : base(id)
    {
        IdentityId = identityId;
        UserName = userName;
    }

    [UsedImplicitly] public IdentityId IdentityId { get; private set; } = null!;

    /// <summary>The name the person signs in with (Keycloak's <c>preferred_username</c>), for people to read.</summary>
    [UsedImplicitly] public string UserName { get; private set; } = string.Empty;

    /// <summary>The roles this user holds, in the order they were assigned.</summary>
    public IReadOnlyList<RoleAssignment> RoleAssignments => _roleAssignments.AsReadOnly();

    /// <summary>Registers a user against their identity and raises <see cref="UserRegistered" />.</summary>
    public static Result<User> Register(
        IdentityId identityId,
        string? userName,
        IIdGenerator ids,
        IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(identityId);
        ArgumentNullException.ThrowIfNull(ids);
        ArgumentNullException.ThrowIfNull(clock);

        string trimmed = userName?.Trim() ?? string.Empty;

        if (trimmed.Length is 0 or > MaxLengthUserName)
        {
            return Result.Failure<User>(DomainError.Validation(
                UserNameInvalidErrorCode,
                $"A user name is 1 to {MaxLengthUserName} characters, not '{userName}'."));
        }

        var user = new User(new UserId(ids.NewId()), identityId, trimmed);
        user.Raise(new UserRegistered(user.Id, identityId, clock.Now));

        return user;
    }

    /// <summary>Assigns the role <paramref name="roleId" /> and raises <see cref="RoleAssigned" />.</summary>
    public Result AssignRole(RoleId roleId, IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (Holds(roleId))
        {
            return Result.Failure(DomainError.Conflict(
                AlreadyAssignedErrorCode,
                $"{UserName} already holds role {roleId}."));
        }

        var now = clock.Now;
        _roleAssignments.Add(new RoleAssignment(roleId, now));
        Raise(new RoleAssigned(Id, roleId, now));

        return Result.Success();
    }

    /// <summary>Takes the role <paramref name="roleId" /> away and raises <see cref="RoleUnassigned" />.</summary>
    public Result UnassignRole(RoleId roleId, IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (_roleAssignments.RemoveAll(assignment => assignment.RoleId == roleId) == 0)
        {
            return Result.Failure(DomainError.Conflict(
                NotAssignedErrorCode,
                $"{UserName} does not hold role {roleId}."));
        }

        Raise(new RoleUnassigned(Id, roleId, clock.Now));

        return Result.Success();
    }

    /// <summary>Whether this user holds the role <paramref name="roleId" />.</summary>
    public bool Holds(RoleId roleId)
    {
        return _roleAssignments.Exists(assignment => assignment.RoleId == roleId);
    }
}
