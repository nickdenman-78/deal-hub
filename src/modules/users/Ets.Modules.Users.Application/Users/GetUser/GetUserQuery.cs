using Ets.Core.Domain.CQRS;

namespace Ets.Modules.Users.Application.Users.GetUser;

/// <summary>One user and the roles they hold.</summary>
/// <param name="UserId">The user's id.</param>
public sealed record GetUserQuery(Guid UserId) : IQuery<UserResponse>;
