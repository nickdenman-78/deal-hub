using Ets.Core.Infrastructure;
using Ets.Modules.Deals.Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ets.Modules.Deals.Infrastructure.Persistence.Configuration;

[UsedImplicitly]
internal sealed class DbAsxProductMap : IEntityTypeConfiguration<DbAsxProduct>
{
    /// <summary>ASX 24 product codes are five characters: commodity code, month letter, 2-digit year.</summary>
    private const int MaxLengthProductCode = 5;

    public void Configure(EntityTypeBuilder<DbAsxProduct> builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.ToTable("asx_products");

        builder.HasKey(product => product.ProductCode);

        builder.Property(product => product.ProductCode)
            .HasMaxLength(MaxLengthProductCode)
            .ValueGeneratedNever()
            .HasColumnOrder(1);
        builder.Property(product => product.NumberOfDays)
            .HasColumnOrder(10);
        builder.Property(product => product.ContractSize)
            .HasColumnType(DatabaseDefaults.TypeVolume)
            .HasColumnOrder(20);
    }
}
