using Ets.Core.Domain.Events;
using Ets.Modules.Users.Domain.ValueObjects;

namespace Ets.Modules.Users.Domain.Events;

/// <summary>A permission was granted to a role.</summary>
public sealed record PermissionGranted(RoleId RoleId, Permission Permission, DateTimeOffset OccurredAt) : IDomainEvent;
