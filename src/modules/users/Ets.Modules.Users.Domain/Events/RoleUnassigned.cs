using Ets.Core.Domain.Events;
using Ets.Modules.Users.Domain.ValueObjects;

namespace Ets.Modules.Users.Domain.Events;

/// <summary>A role was taken away from a user.</summary>
public sealed record RoleUnassigned(UserId UserId, RoleId RoleId, DateTimeOffset OccurredAt) : IDomainEvent;
