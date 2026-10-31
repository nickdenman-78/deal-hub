using Ets.Core.Domain.Models;
using Ets.Core.Domain.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Ets.Core.Infrastructure.Persistence;

/// <summary>
///     Base for every module's EF Core context (ADR-0010).
/// </summary>
/// <remarks>
///     <list type="bullet">
///         <item>Stamps <see cref="IAudited" /> entities with who and when, in UTC.</item>
///         <item>Turns deletes of <see cref="ISoftDelete" /> entities into a flag.</item>
///         <item>Stores every enum as its member name (max 64 characters), never an ordinal.</item>
///         <item>
///             Writes every <see cref="DateTimeOffset" /> in UTC. Npgsql only accepts offset 0 for
///             <c>timestamp with time zone</c>, and domain code stamps market time (UTC+10) from
///             <see cref="IDateTimeProvider.Now" />. The instant is unchanged; it reads back with offset 0.
///         </item>
///     </list>
///     A module's context sets its default schema and calls
///     <see cref="ModelBuilderExtensions.ApplyAllConfigurations{TDbContext}" /> in <c>OnModelCreating</c>,
///     and is registered with <c>UseSnakeCaseNamingConvention()</c> and a migrations history table in its
///     own schema.
/// </remarks>
public abstract class DbContextBase : DbContext
{
    private readonly IDateTimeProvider? _clock;
    private readonly IContextUser? _contextUser;

    protected DbContextBase(DbContextOptions options) : base(options)
    {
    }

    protected DbContextBase(DbContextOptions options, IContextUser contextUser, IDateTimeProvider clock)
        : base(options)
    {
        _contextUser = contextUser;
        _clock = clock;
    }

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        SoftDelete();
        UpdateAuditInfo();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override Task<int> SaveChangesAsync(
        bool acceptAllChangesOnSuccess,
        CancellationToken cancellationToken = default)
    {
        SoftDelete();
        UpdateAuditInfo();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        ArgumentNullException.ThrowIfNull(configurationBuilder);

        // The stored text is the *Value enum member name (PeakLoad), never the enumeration's display name.
        configurationBuilder
            .Properties<Enum>()
            .HaveConversion<string>()
            .HaveMaxLength(DatabaseDefaults.MaxLengthEnum);

        configurationBuilder
            .Properties<DateTimeOffset>()
            .HaveConversion<UtcDateTimeOffsetConverter>();

        base.ConfigureConventions(configurationBuilder);
    }

    private void SoftDelete()
    {
        var entries = ChangeTracker.Entries()
            .Where(x => x is {Entity: ISoftDelete, State: EntityState.Deleted})
            .ToList();

        if (entries.Count == 0)
        {
            return;
        }

        foreach (var entry in entries)
        {
            entry.Reload();
            entry.CurrentValues[nameof(ISoftDelete.IsDeleted)] = true;
            entry.State = EntityState.Modified;
        }

        ChangeTracker.DetectChanges();
    }

    private void UpdateAuditInfo()
    {
        var entries = ChangeTracker.Entries()
            .Where(x => x is {Entity: IAudited, State: EntityState.Added or EntityState.Modified})
            .ToList();

        if (entries.Count == 0)
        {
            return;
        }

        string? user = DescribeUser();
        var now = _clock?.UtcNow ?? DateTimeOffset.UtcNow;

        foreach (var entry in entries)
        {
            var audited = (IAudited)entry.Entity;

            switch (entry.State)
            {
                case EntityState.Added:
                    audited.DateCreated = audited.DateModified = now;
                    audited.CreatedBy = audited.ModifiedBy = user;
                    break;
                case EntityState.Modified:
                    audited.DateCreated =
                        entry.OriginalValues.GetValue<DateTimeOffset?>(nameof(IAudited.DateCreated)) ?? now;
                    audited.CreatedBy =
                        entry.OriginalValues.GetValue<string?>(nameof(IAudited.CreatedBy)) ?? user;
                    audited.DateModified = now;
                    audited.ModifiedBy = user;
                    break;
            }
        }
    }

    /// <summary>
    ///     "Name (email)" when the caller is known, the identity id when only that is, otherwise
    ///     <see langword="null" /> — a save nobody asked for records no user.
    /// </summary>
    private string? DescribeUser()
    {
        if (_contextUser is null)
        {
            return null;
        }

        if (string.IsNullOrWhiteSpace(_contextUser.Name))
        {
            return string.IsNullOrWhiteSpace(_contextUser.IdentityId) ? null : _contextUser.IdentityId;
        }

        return string.IsNullOrWhiteSpace(_contextUser.Email)
            ? _contextUser.Name
            : $"{_contextUser.Name} ({_contextUser.Email})";
    }

    /// <summary>Normalises a <see cref="DateTimeOffset" /> to UTC on the way to the database.</summary>
    private sealed class UtcDateTimeOffsetConverter() : ValueConverter<DateTimeOffset, DateTimeOffset>(
        value => value.ToUniversalTime(),
        value => value);
}
