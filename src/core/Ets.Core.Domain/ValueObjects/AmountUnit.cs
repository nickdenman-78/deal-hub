namespace Ets.Core.Domain.ValueObjects;

public abstract record AmountUnit : Enumeration<AmountUnitValue, AmountUnit>
{
    [UsedImplicitly] public static readonly AmountUnit None = new Unspecified();
    [UsedImplicitly] public static readonly AmountUnit CentsPerKW = new CentsPerKilowatt();
    [UsedImplicitly] public static readonly AmountUnit DollarPerMW = new DollarPerMegawatt();
    [UsedImplicitly] public static readonly AmountUnit CentsPerKWh = new CentsPerKilowattHour();
    [UsedImplicitly] public static readonly AmountUnit DollarPerMWh = new DollarPerMegawattHour();

    private AmountUnit(AmountUnitValue id, string name) : base(id, name)
    {
    }

    [UsedImplicitly] public abstract decimal ConversionFactor { get; }
    [UsedImplicitly] public abstract string Description { get; }
    [UsedImplicitly] public abstract string Symbol { get; }

    [UsedImplicitly]
    public static AmountUnit? FromSymbol(string symbol)
    {
        return Enumerations.Values.SingleOrDefault(x => x.Symbol.Equals(symbol, StringComparison.OrdinalIgnoreCase));
    }

    private sealed record Unspecified() : AmountUnit(0, string.Empty)
    {
        public override decimal ConversionFactor => 1;
        public override string Description => string.Empty;
        public override string Symbol => string.Empty;
    }

    private sealed record CentsPerKilowatt() : AmountUnit(AmountUnitValue.CentsPerKW, "CentsPerKilowatt")
    {
        public override decimal ConversionFactor => 0.1M; // from $/MW => c/kW
        public override string Description => "Cents per Kilowatt";
        public override string Symbol => "c/kW";
    }

    private sealed record DollarPerMegawatt() : AmountUnit(AmountUnitValue.DollarPerMW, "DollarPerMegawatt")
    {
        public override decimal ConversionFactor => 1; // $/MW
        public override string Description => "Dollar per Megawatt";
        public override string Symbol => "$/MW";
    }

    private sealed record CentsPerKilowattHour() : AmountUnit(AmountUnitValue.CentsPerKWh, "CentsPerKilowattHour")
    {
        public override decimal ConversionFactor => 0.1M; // from $/MW => c/kW
        public override string Description => "Cents per Kilowatt-hour";
        public override string Symbol => "c/kWh";
    }

    private sealed record DollarPerMegawattHour() : AmountUnit(AmountUnitValue.DollarPerMWh, "DollarPerMegawattHour")
    {
        public override decimal ConversionFactor => 1; // $/MWh
        public override string Description => "Dollar per Megawatt-hour";
        public override string Symbol => "$/MWh";
    }
}
