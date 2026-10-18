namespace Ets.Core.Domain.ValueObjects;

public abstract record VolumeUnit : Enumeration<VolumeUnitValue, VolumeUnit>
{
    [UsedImplicitly] public static readonly VolumeUnit None = new Unspecified();
    [UsedImplicitly] public static readonly VolumeUnit KW = new KiloWatt();
    [UsedImplicitly] public static readonly VolumeUnit MW = new MegaWatt();
    [UsedImplicitly] public static readonly VolumeUnit KWh = new KiloWattHour();
    [UsedImplicitly] public static readonly VolumeUnit MWh = new MegaWattHour();

    private VolumeUnit(VolumeUnitValue value, string name) : base(value, name)
    {
    }

    [UsedImplicitly] public abstract decimal ConversionFactor { get; }
    [UsedImplicitly] public abstract string Description { get; }
    [UsedImplicitly] public abstract string Symbol { get; }

    private sealed record Unspecified() : VolumeUnit(VolumeUnitValue.None, string.Empty)
    {
        public override decimal ConversionFactor => 1;
        public override string Description => string.Empty;
        public override string Symbol => string.Empty;
    }

    private sealed record KiloWatt() : VolumeUnit(VolumeUnitValue.KW, "kW")
    {
        public override decimal ConversionFactor => 1_000;
        public override string Description => "Kilowatt";
        public override string Symbol => "kW";
    }

    private sealed record MegaWatt() : VolumeUnit(VolumeUnitValue.MW, "MW")
    {
        public override decimal ConversionFactor => 1_000_000;
        public override string Description => "Megawatt";
        public override string Symbol => "MW";
    }

    private sealed record KiloWattHour() : VolumeUnit(VolumeUnitValue.KWh, "kWh")
    {
        public override decimal ConversionFactor => 1_000;
        public override string Description => "Kilowatt-hour";
        public override string Symbol => "kWh";
    }

    private sealed record MegaWattHour() : VolumeUnit(VolumeUnitValue.MWh, "MWh")
    {
        public override decimal ConversionFactor => 1_000_000;
        public override string Description => "Megawatt-hour";
        public override string Symbol => "MWh";
    }
}
