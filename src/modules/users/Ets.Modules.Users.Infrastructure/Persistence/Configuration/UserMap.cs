using Ets.Modules.Users.Domain.Models;
using Ets.Modules.Users.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ets.Modules.Users.Infrastructure.Persistence.Configuration;

/// <summary>
///     <see cref="User" /> in <c>users</c>, and the roles the user holds in <c>user_roles</c>, one row per role.
/// </summary>
[UsedImplicitly]
internal sealed class UserMap : IEntityTypeConfiguration<User>
{
    private const string UserIdColumn = "UserId";

    public void Configure(EntityTypeBuilder<User> builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.ToTable("users");

        builder.HasKey(user => user.Id);
        builder.Ignore(user => user.DomainEvents);

        builder.Property(user => user.Id)
            .HasConversion(id => id.Value, value => new UserId(value))
            .ValueGeneratedNever()
            .HasColumnOrder(1);
        builder.Property(user => user.IdentityId)
            .HasConversion(identity => identity.Value, value => IdentityId.Create(value).Value)
            .HasMaxLength(IdentityId.MaxLength)
            .HasColumnOrder(10);
        builder.Property(user => user.UserName)
            .HasMaxLength(User.MaxLengthUserName)
            .HasColumnOrder(20);

        builder.HasIndex(user => user.IdentityId).IsUnique();

        builder.OwnsMany(user => user.RoleAssignments, assignment =>
        {
            assignment.ToTable("user_roles");

            assignment.WithOwner().HasForeignKey(UserIdColumn);
            assignment.Property<UserId>(UserIdColumn)
                .HasConversion(id => id.Value, value => new UserId(value))
                .HasColumnOrder(1);
            assignment.Property(held => held.RoleId)
                .HasConversion(id => id.Value, value => new RoleId(value))
                .HasColumnOrder(10);
            assignment.Property(held => held.AssignedAt)
                .HasColumnOrder(20);

            assignment.HasKey(UserIdColumn, nameof(RoleAssignment.RoleId));

            // A role cannot be deleted while a user holds it.
            assignment.HasOne<Role>()
                .WithMany()
                .HasForeignKey(held => held.RoleId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Navigation(user => user.RoleAssignments).UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}
