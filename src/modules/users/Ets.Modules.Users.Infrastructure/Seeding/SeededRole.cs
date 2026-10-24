namespace Ets.Modules.Users.Infrastructure.Seeding;

/// <summary>A role in <see cref="UsersDevelopmentSeedOptions" /> and the permissions it grants.</summary>
internal sealed class SeededRole
{
    public string Name { get; set; } = string.Empty;

    public IList<string> Permissions { get; } = [];
}
