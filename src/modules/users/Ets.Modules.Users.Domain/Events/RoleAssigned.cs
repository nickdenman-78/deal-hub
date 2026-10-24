using Ets.Core.Domain.Events;
using Ets.Modules.Users.Domain.ValueObjects;

namespace Ets.Modules.Users.Domain.Events;

/// <summary>A role was assigned to a user.</summary>
public sealed record RoleAssigned(UserId UserId, RoleId RoleId, DateTimeOffset OccurredAt) : IDomainEvent;
