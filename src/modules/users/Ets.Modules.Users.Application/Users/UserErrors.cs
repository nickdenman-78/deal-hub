using Ets.Core.Domain.Models;
using Ets.Modules.Users.Domain.ValueObjects;

namespace Ets.Modules.Users.Application.Users;

/// <summary>The failures the user use cases share.</summary>
internal static class UserErrors
{
    public const string NotFoundErrorCode = "user.not-found";
    public const string IdentityTakenErrorCode = "user.identity-id.taken";

    public static DomainError NotFound(Guid userId)
    {
        return DomainError.NotFound(NotFoundErrorCode, $"There is no user {userId}.");
    }

    public static DomainError IdentityTaken(IdentityId identityId)
    {
        return DomainError.Conflict(IdentityTakenErrorCode, $"A user with identity {identityId} is already registered.");
    }
}
