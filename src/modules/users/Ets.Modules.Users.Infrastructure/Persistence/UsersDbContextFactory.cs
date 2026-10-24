using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Ets.Modules.Users.Infrastructure.Persistence;

/// <summary>
///     Lets the <c>dotnet ef</c> tools build the context from this project alone, with the connection string
///     from <c>appsettings.Migrations.json</c>.
/// </summary>
/// <remarks>
///     Later sources win: <c>appsettings.Migrations.json</c> (committed, no password),
///     <c>appsettings.Migrations.local.json</c> (git-ignored) and the <c>ConnectionStrings__ets</c> environment
///     variable, the same key the AppHost gives the API. Adding a migration never opens a connection; applying
///     one needs the real connection string in one of the later two.
/// </remarks>
[UsedImplicitly]
internal sealed class UsersDbContextFactory : IDesignTimeDbContextFactory<UsersDbContext>
{
    private const string SettingsFile = "appsettings.Migrations.json";
    private const string LocalSettingsFile = "appsettings.Migrations.local.json";

    public UsersDbContext CreateDbContext(string[] args)
    {
        var configuration = new ConfigurationBuilder()
            .SetBasePath(AppContext.BaseDirectory)
            .AddJsonFile(SettingsFile, optional: false)
            .AddJsonFile(LocalSettingsFile, optional: true)
            .AddEnvironmentVariables()
            .Build();

        string connectionString = configuration.GetConnectionString(UsersDbContext.ConnectionStringName) ??
                                  throw new InvalidOperationException(
                                      $"ConnectionStrings:{UsersDbContext.ConnectionStringName} is not set in {SettingsFile}.");

        var options = new DbContextOptionsBuilder<UsersDbContext>();
        UsersDbContext.Configure(options, connectionString);

        return new UsersDbContext(options.Options);
    }
}
