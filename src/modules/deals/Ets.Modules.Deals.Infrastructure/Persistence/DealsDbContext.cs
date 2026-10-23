using Ets.Core.Domain.Models;
using Ets.Core.Domain.Services;
using Ets.Core.Infrastructure.Persistence;
using Ets.Modules.Deals.Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Ets.Modules.Deals.Infrastructure.Persistence;

/// <summary>
///     The Deals module's EF Core context, in the <c>deals</c> schema (ADR-0010). It holds reference data the
///     write side looks up, such as the ASX product catalogue. Deals themselves are event sourced in Marten
///     (ADR-0013) and never stored here.
/// </summary>
public sealed class DealsDbContext : DbContextBase
{
    /// <summary>The module's schema; the migrations history table lives in it too.</summary>
    public const string Schema = "deals";

    /// <summary>The connection string the AppHost passes (<c>ConnectionStrings:ets</c>).</summary>
    public const string ConnectionStringName = "ets";

    public DealsDbContext(DbContextOptions<DealsDbContext> options, IContextUser contextUser, IDateTimeProvider clock)
        : base(options, contextUser, clock)
    {
    }

    /// <summary>For design-time tools, which have no caller or clock.</summary>
    internal DealsDbContext(DbContextOptions<DealsDbContext> options) : base(options)
    {
    }

    internal DbSet<DbAsxProduct> AsxProducts => Set<DbAsxProduct>();

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
        modelBuilder.ApplyAllConfigurations<DealsDbContext>();
    }
}
