using System.Linq.Expressions;
using System.Reflection;
using Ets.Core.Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ets.Core.Infrastructure.Persistence;

/// <summary>
///     Model conventions shared by every module's context (ADR-0010).
/// </summary>
/// <remarks>
///     Column <em>names</em> are left to <c>UseSnakeCaseNamingConvention()</c>; only order, type and
///     defaults are set here. Audit columns sit in the 9900s and the soft-delete flag at 9998, after every
///     map's own columns.
/// </remarks>
public static class ModelBuilderExtensions
{
    private const int ColumnOrderDateCreated = 9901;
    private const int ColumnOrderCreatedBy = 9902;
    private const int ColumnOrderDateModified = 9903;
    private const int ColumnOrderModifiedBy = 9904;
    private const int ColumnOrderIsDeleted = 9998;

    /// <summary>
    ///     Applies every <see cref="IEntityTypeConfiguration{TEntity}" /> in the namespace of
    ///     <typeparamref name="TDbContext" /> (and below), then the audit and soft-delete conventions for the
    ///     root of each configured type.
    /// </summary>
    /// <param name="modelBuilder">The model builder from <c>OnModelCreating</c>.</param>
    /// <param name="configure">Optional extra configuration applied per configured entity type.</param>
    /// <typeparam name="TDbContext">The module's context; its namespace scopes the maps it picks up.</typeparam>
    /// <remarks>
    ///     Maps are discovered by namespace, not by assembly, so two contexts in one Infrastructure project
    ///     (a read-model context beside a write context) never pick up each other's maps.
    /// </remarks>
    public static void ApplyAllConfigurations<TDbContext>(
        this ModelBuilder modelBuilder,
        Action<ModelBuilder, Type>? configure = null)
        where TDbContext : DbContext
    {
        ArgumentNullException.ThrowIfNull(modelBuilder);

        var applyConfiguration = typeof(ModelBuilder)
            .GetMethods(BindingFlags.Instance | BindingFlags.Public)
            .First(m => m.Name == nameof(ModelBuilder.ApplyConfiguration) &&
                        m.GetParameters() is [{ } parameter] &&
                        parameter.ParameterType.IsGenericType &&
                        parameter.ParameterType.GetGenericTypeDefinition() == typeof(IEntityTypeConfiguration<>));

        foreach (var configurationType in NamespaceTypes<TDbContext>())
        {
            var configurationInterface = configurationType
                .GetInterfaces()
                .FirstOrDefault(i => i.IsGenericType &&
                                     i.GetGenericTypeDefinition() == typeof(IEntityTypeConfiguration<>));

            if (configurationInterface is null || configurationType.IsAbstract)
            {
                continue;
            }

            var entityType = configurationInterface.GetGenericArguments()[0];
            object configuration = Activator.CreateInstance(configurationType)!;

            applyConfiguration.MakeGenericMethod(entityType).Invoke(modelBuilder, [configuration]);

            // Conventions go on the root of a hierarchy only: TPH subtypes share its columns.
            bool isRoot = entityType.BaseType is null || entityType.BaseType == typeof(object);

            if (isRoot && entityType.IsAssignableTo(typeof(IAudited)))
            {
                modelBuilder.Entity(entityType).ApplyAudit();
            }

            if (isRoot && entityType.IsAssignableTo(typeof(ISoftDelete)))
            {
                modelBuilder.Entity(entityType).ApplySoftDelete();
            }

            configure?.Invoke(modelBuilder, entityType);
        }
    }

    [UsedImplicitly]
    public static PropertyBuilder IsOptional(this PropertyBuilder builder)
    {
        ArgumentNullException.ThrowIfNull(builder);
        return builder.IsRequired(false);
    }

    /// <summary>
    ///     Maps the <see cref="IAudited" /> columns.
    /// </summary>
    public static EntityTypeBuilder ApplyAudit(this EntityTypeBuilder builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.Property(nameof(IAudited.DateCreated))
            .HasColumnType(DatabaseDefaults.TypeTimestamp)
            .HasDefaultValueSql(DatabaseDefaults.FunctionNow)
            .HasColumnOrder(ColumnOrderDateCreated)
            .IsOptional();
        builder.Property(nameof(IAudited.CreatedBy))
            .HasMaxLength(DatabaseDefaults.MaxLengthName)
            .HasColumnOrder(ColumnOrderCreatedBy)
            .IsOptional();
        builder.Property(nameof(IAudited.DateModified))
            .HasColumnType(DatabaseDefaults.TypeTimestamp)
            .HasColumnOrder(ColumnOrderDateModified)
            .IsOptional();
        builder.Property(nameof(IAudited.ModifiedBy))
            .HasMaxLength(DatabaseDefaults.MaxLengthName)
            .HasColumnOrder(ColumnOrderModifiedBy)
            .IsOptional();

        return builder;
    }

    /// <summary>
    ///     Maps the <see cref="ISoftDelete" /> flag <em>and</em> the global query filter that hides flagged
    ///     rows. The two are applied together so no entity can adopt soft delete without the filter.
    /// </summary>
    public static EntityTypeBuilder ApplySoftDelete(this EntityTypeBuilder builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.Property(nameof(ISoftDelete.IsDeleted))
            .HasColumnOrder(ColumnOrderIsDeleted)
            .IsOptional();

        // e => e.IsDeleted != true
        var entity = Expression.Parameter(builder.Metadata.ClrType, "e");
        var notDeleted = Expression.NotEqual(
            Expression.Property(entity, nameof(ISoftDelete.IsDeleted)),
            Expression.Constant(true, typeof(bool?)));

        builder.HasQueryFilter(Expression.Lambda(notDeleted, entity));

        return builder;
    }

    private static Type[] NamespaceTypes<TDbContext>()
        where TDbContext : DbContext
    {
        string? ns = typeof(TDbContext).Namespace;

        if (string.IsNullOrWhiteSpace(ns))
        {
            throw new InvalidOperationException($"{typeof(TDbContext).Name} must be declared in a namespace.");
        }

        return typeof(TDbContext).Assembly
            .GetTypes()
            .Where(t => t.Namespace is not null &&
                        (t.Namespace == ns || t.Namespace.StartsWith(ns + ".", StringComparison.Ordinal)))
            .ToArray();
    }
}
