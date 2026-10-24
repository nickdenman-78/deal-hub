namespace Ets.Modules.Users.IntegrationEvents.Authorization;

/// <summary>
///     What a signed-in person may do: the permissions granted by every role their user holds (ADR-0006).
/// </summary>
/// <remarks>
///     Published so any module or the host can ask without reading the Users schema. Keyed by the identity
///     provider's subject (the <c>sub</c> claim), which is all a caller's token says about them.
/// </remarks>
public interface IUserPermissionsQuery
{
    /// <summary>
    ///     The distinct permissions the user with <paramref name="identityId" /> holds, in ordinal order; empty
    ///     when no user is registered for that identity.
    /// </summary>
    Task<IReadOnlyList<string>> GetPermissionsAsync(string identityId, CancellationToken cancellationToken);
}
