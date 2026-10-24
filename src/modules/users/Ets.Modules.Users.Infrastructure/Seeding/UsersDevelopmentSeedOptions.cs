namespace Ets.Modules.Users.Infrastructure.Seeding;

/// <summary>
///     Roles and users to create when the host starts, so a fresh local database has someone who may sign in
///     and do things. Development only: the host's <c>appsettings.Development.json</c> is the only place that
///     sets it.
/// </summary>
/// <remarks>
///     The seed only adds. A role missing a listed permission is granted it, and a user missing a listed role is
///     assigned it; nothing already in the database is removed.
/// </remarks>
internal sealed class UsersDevelopmentSeedOptions
{
    public const string SectionName = "Users:DevelopmentSeed";

    /// <summary>Whether to apply the Users migrations and seed at startup. Off unless set.</summary>
    public bool Enabled { get; set; }

    public IList<SeededRole> Roles { get; } = [];

    public IList<SeededUser> Users { get; } = [];

    internal bool IsValid()
    {
        return Roles.All(role => !string.IsNullOrWhiteSpace(role.Name)) &&
               Users.All(user => !string.IsNullOrWhiteSpace(user.IdentityId) &&
                                 user.Roles.All(name => Roles.Any(role => string.Equals(
                                     role.Name,
                                     name,
                                     StringComparison.OrdinalIgnoreCase))));
    }
}
