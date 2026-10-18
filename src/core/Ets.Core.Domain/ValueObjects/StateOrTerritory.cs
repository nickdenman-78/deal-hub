using System.Diagnostics.CodeAnalysis;
using System.Text.Json.Serialization;

namespace Ets.Core.Domain.ValueObjects;

public abstract record StateOrTerritory : Enumeration<StateOrTerritoryValue, StateOrTerritory>
{
    [UsedImplicitly] public static readonly StateOrTerritory None = new Unspecified();
    [UsedImplicitly] public static readonly StateOrTerritory QLD = new Queensland();
    [UsedImplicitly] public static readonly StateOrTerritory NSW = new NewSouthWales();
    [UsedImplicitly] public static readonly StateOrTerritory NSWACT = new NewSouthWalesAndAustralianCapitalTerritory();
    [UsedImplicitly] public static readonly StateOrTerritory ACT = new AustralianCapitalTerritory();
    [UsedImplicitly] public static readonly StateOrTerritory VIC = new Victoria();
    [UsedImplicitly] public static readonly StateOrTerritory SA = new SouthAustralia();
    [UsedImplicitly] public static readonly StateOrTerritory WA = new WesternAustralia();
    [UsedImplicitly] public static readonly StateOrTerritory TAS = new Tasmania();
    [UsedImplicitly] public static readonly StateOrTerritory NT = new NorthernTerritory();
    [UsedImplicitly] public static readonly StateOrTerritory NZ = new NewZealand();

    private StateOrTerritory(StateOrTerritoryValue value, string name) : base(value, name)
    {
    }

    [JsonPropertyOrder(100)]
    [UsedImplicitly]
    public abstract string Description { get; }

    [JsonPropertyOrder(500)]
    [UsedImplicitly]
    public abstract ICollection<StateOrTerritory> Children { get; }

    [UsedImplicitly]
    [SuppressMessage("Design", "CA1034:Nested types should not be visible", Justification = "This is a record")]
    [JsonIgnore]
    public abstract int SortOrder { get; }

    [UsedImplicitly] [JsonIgnore] public static IEnumerable<StateOrTerritory> Items => Enumerations.Values.OrderBy(x => x.SortOrder);

    [UsedImplicitly]
    public static bool TryParse(string? value, [NotNullWhen(true)] out StateOrTerritory? stateOrTerritory)
    {
        stateOrTerritory = Enumerations.FirstOrDefault(x => x.Value.Name.Equals(value, StringComparison.OrdinalIgnoreCase) ||
                                                            x.Value.Description.Equals(value, StringComparison.OrdinalIgnoreCase) ||
                                                            Enum.GetName(x.Value.Value)?.Equals(value, StringComparison.OrdinalIgnoreCase) == true).Value;
        return stateOrTerritory != null;
    }

    [UsedImplicitly]
    private sealed record Unspecified() : StateOrTerritory(StateOrTerritoryValue.None, string.Empty)
    {
        public override string Description => string.Empty;
        public override ICollection<StateOrTerritory> Children => [];
        public override int SortOrder => 0;
    }

    private sealed record Queensland() : StateOrTerritory(StateOrTerritoryValue.QLD, "QLD")
    {
        public override string Description => "Queensland";
        public override ICollection<StateOrTerritory> Children => [];
        public override int SortOrder => 1;
    }

    private sealed record NewSouthWales() : StateOrTerritory(StateOrTerritoryValue.NSW, "NSW")
    {
        public override string Description => "New South Wales";
        public override ICollection<StateOrTerritory> Children => [];
        public override int SortOrder => 2;
    }

    private sealed record NewSouthWalesAndAustralianCapitalTerritory() : StateOrTerritory(StateOrTerritoryValue.NSWACT, "NSW/ACT")
    {
        public override string Description => "New South Wales and Australian Capital Territory";
        public override ICollection<StateOrTerritory> Children => [NSW, ACT];
        public override int SortOrder => 3;
    }

    private sealed record AustralianCapitalTerritory() : StateOrTerritory(StateOrTerritoryValue.ACT, "ACT")
    {
        public override string Description => "Australian Capital Territory";
        public override ICollection<StateOrTerritory> Children => [];
        public override int SortOrder => 4;
    }

    private sealed record Victoria() : StateOrTerritory(StateOrTerritoryValue.VIC, "VIC")
    {
        public override string Description => "Victoria";
        public override ICollection<StateOrTerritory> Children => [];
        public override int SortOrder => 5;
    }

    private sealed record SouthAustralia() : StateOrTerritory(StateOrTerritoryValue.SA, "SA")
    {
        public override string Description => "South Australia";
        public override ICollection<StateOrTerritory> Children => [];
        public override int SortOrder => 6;
    }

    private sealed record WesternAustralia() : StateOrTerritory(StateOrTerritoryValue.WA, "WA")
    {
        public override string Description => "Western Australia";
        public override ICollection<StateOrTerritory> Children => [];
        public override int SortOrder => 7;
    }

    private sealed record Tasmania() : StateOrTerritory(StateOrTerritoryValue.TAS, "TAS")
    {
        public override string Description => "Tasmania";
        public override ICollection<StateOrTerritory> Children => [];
        public override int SortOrder => 8;
    }

    private sealed record NorthernTerritory() : StateOrTerritory(StateOrTerritoryValue.NT, "NT")
    {
        public override string Description => "Northern Territory";
        public override ICollection<StateOrTerritory> Children => [];
        public override int SortOrder => 9;
    }

    private sealed record NewZealand() : StateOrTerritory(StateOrTerritoryValue.NZ, "NZ")
    {
        public override string Description => "New Zealand";
        public override ICollection<StateOrTerritory> Children => [];
        public override int SortOrder => 10;
    }
}
