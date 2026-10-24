using Ets.Core.Domain.Models;

namespace Ets.Modules.Users.Domain.ValueObjects;

/// <summary>A role held by a user, and when it was assigned.</summary>
public sealed record RoleAssignment(RoleId RoleId, DateTimeOffset AssignedAt) : IValueObject;
