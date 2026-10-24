using Ets.Modules.Users.Domain.Models;
using Ets.Modules.Users.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ets.Modules.Users.Infrastructure.Persistence.Configuration;

/// <summary>
///     <see cref="Role" /> in <c>roles</c>, and the permissions it grants in <c>role_permissions</c>, one row
///     per permission.
/// </summary>
[UsedImplicitly]
internal sealed class RoleMap : IEntityTypeConfiguration<Role>
{
    private const string RoleIdColumn = "RoleId";

    public void Configure(EntityTypeBuilder<Role> builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.ToTable("roles");

        builder.HasKey(role => role.Id);
        builder.Ignore(role => role.DomainEvents);

        builder.Property(role => role.Id)
            .HasConversion(id => id.Value, value => new RoleId(value))
            .ValueGeneratedNever()
            .HasColumnOrder(1);
        builder.Property(role => role.Name)
            .HasConversion(name => name.Value, value => RoleName.Create(value).Value)
            .HasMaxLength(RoleName.MaxLength)
            .HasColumnOrder(10);

        builder.HasIndex(role => role.Name).IsUnique();

        builder.OwnsMany(role => role.Permissions, permission =>
        {
            permission.ToTable("role_permissions");

            permission.WithOwner().HasForeignKey(RoleIdColumn);
            permission.Property<RoleId>(RoleIdColumn)
                .HasConversion(id => id.Value, value => new RoleId(value))
                .HasColumnOrder(1);
            permission.Property(granted => granted.Value)
                .HasColumnName("permission")
                .HasMaxLength(Permission.MaxLength)
                .HasColumnOrder(10);

            permission.HasKey(RoleIdColumn, nameof(Permission.Value));
        });

        builder.Navigation(role => role.Permissions).UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}
