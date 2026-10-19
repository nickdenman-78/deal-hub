using System.Diagnostics.CodeAnalysis;
using System.Text.Json.Serialization;

namespace Ets.Core.Domain.ValueObjects;

public abstract record TermSpan : Enumeration<TermSpanValue, TermSpan>
{
    [UsedImplicitly] public static readonly TermSpan NonStandard = new NonStandardTermSpan();
    [UsedImplicitly] public static readonly TermSpan Month = new MonthTermSpan();
    [UsedImplicitly] public static readonly TermSpan JanJun = new JanJunTermSpan();
    [UsedImplicitly] public static readonly TermSpan JulDec = new JulDecTermSpan();
    [UsedImplicitly] public static readonly TermSpan Quarter = new QuarterTermSpan();
    [UsedImplicitly] public static readonly TermSpan FinYear = new FinYearTermSpan();
    [UsedImplicitly] public static readonly TermSpan CalYear = new CalYearTermSpan();

    private TermSpan(TermSpanValue value, string name) : base(value, name)
    {
    }

    [UsedImplicitly] public abstract string Code { get; }

    [UsedImplicitly] public abstract string Description { get; }

    [UsedImplicitly]
    [SuppressMessage("Design", "CA1034:Nested types should not be visible", Justification = "This is a record")]
    [JsonIgnore]
    public abstract int SortOrder { get; }

    [UsedImplicitly] public bool IsStandard => !Equals(NonStandard);

    private sealed record NonStandardTermSpan() : TermSpan(TermSpanValue.NonStandard, "Non-Standard")
    {
        public override string Code => "NS";
        public override string Description => "Non-Standard";
        public override int SortOrder => 7;
    }

    private sealed record MonthTermSpan() : TermSpan(TermSpanValue.Month, "Month")
    {
        public override string Code => "M";
        public override string Description => "Month";

        public override int SortOrder => 1;
    }

    private sealed record JanJunTermSpan() : TermSpan(TermSpanValue.JanJun, "Jan-Jun")
    {
        public override string Code => "JJ";
        public override string Description => "January to June";

        public override int SortOrder => 3;
    }

    private sealed record JulDecTermSpan() : TermSpan(TermSpanValue.JulDec, "Jul-Dec")
    {
        public override string Code => "JD";
        public override string Description => "July to December";

        public override int SortOrder => 4;
    }

    private sealed record QuarterTermSpan() : TermSpan(TermSpanValue.Quarter, "Quarter")
    {
        public override string Code => "Q";
        public override string Description => "Quarter";

        public override int SortOrder => 2;
    }

    private sealed record FinYearTermSpan() : TermSpan(TermSpanValue.FinYear, "Financial Year")
    {
        public override string Code => "FY";
        public override string Description => "Financial Year";

        public override int SortOrder => 6;
    }

    private sealed record CalYearTermSpan() : TermSpan(TermSpanValue.CalYear, "Calendar Year")
    {
        public override string Code => "Cal";
        public override string Description => "Calendar Year";

        public override int SortOrder => 5;
    }
}
