using Ets.Core.Domain.Events;
using Ets.Modules.Users.Domain.ValueObjects;

namespace Ets.Modules.Users.Domain.Events;

/// <summary>A person was registered as an ETS user against their identity.</summary>
public sealed record UserRegistered(UserId UserId, IdentityId IdentityId, DateTimeOffset OccurredAt) : IDomainEvent;
