using Ets.Core.Domain.Models;
using Ets.Core.Domain.Services;
using Ets.Core.Infrastructure.Persistence;
using Ets.Modules.Users.Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Ets.Modules.Users.Infrastructure.Persistence;

/// <summary>
///     The Users module's EF Core context, in the <c>users</c> schema (ADR-0010): users, roles, the
///     permissions roles grant and the roles users hold. The domain types are mapped directly.
/// </summary>
public sealed class UsersDbContext : DbContextBase
{
    /// <summary>The module's schema; the migrations history table lives in it too.</summary>
    public const string Schema = "users";

    /// <summary>The connection string the AppHost passes (<c>ConnectionStrings:ets</c>).</summary>
    public const string ConnectionStringName = "ets";

    public UsersDbContext(DbContextOptions<UsersDbContext> options, IContextUser contextUser, IDateTimeProvider clock)
        : base(options, contextUser, clock)
    {
    }

    /// <summary>For design-time tools and tests, which have no caller or clock.</summary>
    internal UsersDbContext(DbContextOptions<UsersDbContext> options) : base(options)
    {
    }

    internal DbSet<Role> Roles => Set<Role>();

    internal DbSet<User> Users => Set<User>();

    /// <summary>The provider settings shared by the module's registration and the design-time factory.</summary>
    internal static DbContextOptionsBuilder Configure(DbContextOptionsBuilder options, string? connectionString)
    {
        return options
            .UseNpgsql(
                connectionString,
                npgsql => npgsql.MigrationsHistoryTable(HistoryRepository.DefaultTableName, Schema))
            .UseSnakeCaseNamingConvention();
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        ArgumentNullException.ThrowIfNull(modelBuilder);

        modelBuilder.HasDefaultSchema(Schema);
        modelBuilder.ApplyAllConfigurations<UsersDbContext>();
    }
}
