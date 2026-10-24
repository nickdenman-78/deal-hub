using Ets.Core.Domain.Events;
using Ets.Modules.Users.Domain.ValueObjects;

namespace Ets.Modules.Users.Domain.Events;

/// <summary>A role was created with its first permissions.</summary>
public sealed record RoleCreated(
    RoleId RoleId,
    RoleName Name,
    IReadOnlyList<Permission> Permissions,
    DateTimeOffset OccurredAt) : IDomainEvent;
