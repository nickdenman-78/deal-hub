using Ets.Core.Infrastructure;
using Ets.Modules.Deals.Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ets.Modules.Deals.Infrastructure.Persistence.Configuration;

[UsedImplicitly]
internal sealed class DbAsxFuturesDealMap : IEntityTypeConfiguration<DbAsxFuturesDeal>
{
    private const int MaxLengthProductCode = 5;
    private const int MaxLengthRegion = 8;
    private const int MaxLengthDirection = 8;

    public void Configure(EntityTypeBuilder<DbAsxFuturesDeal> builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.ToTable("asx_futures_deals");

        builder.HasKey(deal => deal.Id);

        builder.Property(deal => deal.Id).ValueGeneratedNever().HasColumnOrder(1);
        builder.Property(deal => deal.Version).HasColumnOrder(2);
        builder.Property(deal => deal.ProductCode).HasMaxLength(MaxLengthProductCode).HasColumnOrder(10);
        builder.Property(deal => deal.Region).HasMaxLength(MaxLengthRegion).HasColumnOrder(11);
        builder.Property(deal => deal.LoadProfile).HasMaxLength(DatabaseDefaults.MaxLengthEnum).HasColumnOrder(12);
        builder.Property(deal => deal.Payoff).HasMaxLength(DatabaseDefaults.MaxLengthEnum).HasColumnOrder(13);
        builder.Property(deal => deal.Period).HasMaxLength(DatabaseDefaults.MaxLengthEnum).HasColumnOrder(14);
        builder.Property(deal => deal.Term).HasMaxLength(DatabaseDefaults.MaxLengthEnum).HasColumnOrder(15);
        builder.Property(deal => deal.TermStart).HasColumnType(DatabaseDefaults.TypeDate).HasColumnOrder(16);
        builder.Property(deal => deal.TermEnd).HasColumnType(DatabaseDefaults.TypeDate).HasColumnOrder(17);
        builder.Property(deal => deal.ContractDays).HasColumnOrder(18);
        builder.Property(deal => deal.ContractSize).HasColumnType(DatabaseDefaults.TypeVolume).HasColumnOrder(19);
        builder.Property(deal => deal.Direction).HasMaxLength(MaxLengthDirection).HasColumnOrder(20);
        builder.Property(deal => deal.Price).HasColumnType(DatabaseDefaults.TypeMoney).HasColumnOrder(21);
        builder.Property(deal => deal.Volume).HasColumnType(DatabaseDefaults.TypeVolume).HasColumnOrder(22);
        builder.Property(deal => deal.ContractedEnergy).HasColumnType(DatabaseDefaults.TypeVolume).HasColumnOrder(23);
        builder.Property(deal => deal.CapturedAt).HasColumnType(DatabaseDefaults.TypeTimestamp).HasColumnOrder(24);

        builder.HasIndex(deal => deal.CapturedAt);
        builder.HasIndex(deal => deal.ProductCode);
    }
}
