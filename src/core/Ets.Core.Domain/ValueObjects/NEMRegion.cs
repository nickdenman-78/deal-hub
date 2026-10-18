using System.Diagnostics.CodeAnalysis;
using System.Text.Json.Serialization;

namespace Ets.Core.Domain.ValueObjects;

#pragma warning disable S101
public abstract record NEMRegion : Enumeration<NEMRegionValue, NEMRegion>
#pragma warning restore S101
{
    [UsedImplicitly] public static readonly NEMRegion None = new Unspecified();
    [UsedImplicitly] public static readonly NEMRegion QLD = new Queensland();
    [UsedImplicitly] public static readonly NEMRegion NSW = new NewSouthWales();
    [UsedImplicitly] public static readonly NEMRegion VIC = new Victoria();
    [UsedImplicitly] public static readonly NEMRegion TAS = new Tasmania();
    [UsedImplicitly] public static readonly NEMRegion SA = new SouthAustralia();

    private NEMRegion(NEMRegionValue value, string name) : base(value, name)
    {
    }

    [JsonPropertyOrder(100)]
    [UsedImplicitly]
    public abstract string LegacyName { get; }

    [JsonPropertyOrder(110)]
    [UsedImplicitly]
    public abstract string Description { get; }

    [JsonPropertyOrder(500)]
    [UsedImplicitly]
    public abstract StateOrTerritory StateOrTerritory { get; }

    [UsedImplicitly]
    [SuppressMessage("Design", "CA1034:Nested types should not be visible", Justification = "This is a record")]
    [JsonIgnore]
    public abstract int SortOrder { get; }

    [JsonIgnore] [UsedImplicitly] public static IEnumerable<NEMRegion> Items => Enumerations.Values.OrderBy(x => x.SortOrder);

    [UsedImplicitly]
    public static bool TryParse(string? value, [NotNullWhen(true)] out NEMRegion? region)
    {
        region = Enumerations.FirstOrDefault(x => x.Value.Name.Equals(value, StringComparison.OrdinalIgnoreCase) ||
                                                  x.Value.LegacyName.Equals(value, StringComparison.OrdinalIgnoreCase) ||
                                                  Enum.GetName(x.Value.Value)?.Equals(value, StringComparison.OrdinalIgnoreCase) == true).Value;
        return region != null;
    }

    private sealed record Unspecified() : NEMRegion(NEMRegionValue.None, string.Empty)
    {
        public override string Description => string.Empty;
        public override string LegacyName => string.Empty;
        public override StateOrTerritory StateOrTerritory => StateOrTerritory.None;
        public override int SortOrder => 0;
    }

    private sealed record Queensland() : NEMRegion(NEMRegionValue.QLD, "QLD")
    {
        public override string Description => "Queensland";
        public override string LegacyName => "QLD1";
        public override StateOrTerritory StateOrTerritory => StateOrTerritory.QLD;
        public override int SortOrder => 1;
    }

    private sealed record NewSouthWales() : NEMRegion(NEMRegionValue.NSW, "NSW")
    {
        public override string Description => "New South Wales and ACT";
        public override string LegacyName => "NSW1";
        public override StateOrTerritory StateOrTerritory => StateOrTerritory.NSWACT;
        public override int SortOrder => 2;
    }

    private sealed record Victoria() : NEMRegion(NEMRegionValue.VIC, "VIC")
    {
        public override string Description => "Victoria";
        public override string LegacyName => "VIC1";
        public override StateOrTerritory StateOrTerritory => StateOrTerritory.VIC;
        public override int SortOrder => 3;
    }

    private sealed record Tasmania() : NEMRegion(NEMRegionValue.TAS, "TAS")
    {
        public override string Description => "Tasmania";
        public override string LegacyName => "TAS1";
        public override StateOrTerritory StateOrTerritory => StateOrTerritory.TAS;
        public override int SortOrder => 4;
    }

    private sealed record SouthAustralia() : NEMRegion(NEMRegionValue.SA, "SA")
    {
        public override string Description => "South Australia";
        public override string LegacyName => "SA1";
        public override StateOrTerritory StateOrTerritory => StateOrTerritory.SA;
        public override int SortOrder => 5;
    }
}
