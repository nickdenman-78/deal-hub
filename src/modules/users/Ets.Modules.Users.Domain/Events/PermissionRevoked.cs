using Ets.Core.Domain.Events;
using Ets.Modules.Users.Domain.ValueObjects;

namespace Ets.Modules.Users.Domain.Events;

/// <summary>A permission was revoked from a role.</summary>
public sealed record PermissionRevoked(RoleId RoleId, Permission Permission, DateTimeOffset OccurredAt) : IDomainEvent;
