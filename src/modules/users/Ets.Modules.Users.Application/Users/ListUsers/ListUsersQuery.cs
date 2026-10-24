using Ets.Core.Domain.CQRS;

namespace Ets.Modules.Users.Application.Users.ListUsers;

/// <summary>Every registered user and the roles they hold, ordered by user name.</summary>
public sealed record ListUsersQuery : IQuery<IReadOnlyList<UserResponse>>;
