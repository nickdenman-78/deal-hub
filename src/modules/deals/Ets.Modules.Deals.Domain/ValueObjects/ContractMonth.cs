using System.Diagnostics.CodeAnalysis;
using Ets.Core.Domain.ValueObjects;

namespace Ets.Modules.Deals.Domain.ValueObjects;

/// <summary>
///     The expiry month of a futures contract, written as a futures month letter: F G H J K M N Q U V X Z for
///     January to December.
/// </summary>
public abstract record ContractMonth : Enumeration<ContractMonthValue, ContractMonth>
{
    [UsedImplicitly] public static readonly ContractMonth None = new Unspecified();
    [UsedImplicitly] public static readonly ContractMonth Jan = new January();
    [UsedImplicitly] public static readonly ContractMonth Feb = new February();
    [UsedImplicitly] public static readonly ContractMonth Mar = new March();
    [UsedImplicitly] public static readonly ContractMonth Apr = new April();
    [UsedImplicitly] public static readonly ContractMonth May = new MayMonth();
    [UsedImplicitly] public static readonly ContractMonth Jun = new June();
    [UsedImplicitly] public static readonly ContractMonth Jul = new July();
    [UsedImplicitly] public static readonly ContractMonth Aug = new August();
    [UsedImplicitly] public static readonly ContractMonth Sep = new September();
    [UsedImplicitly] public static readonly ContractMonth Oct = new October();
    [UsedImplicitly] public static readonly ContractMonth Nov = new November();
    [UsedImplicitly] public static readonly ContractMonth Dec = new December();

    private ContractMonth(ContractMonthValue value, string name, string code) : base(value, name)
    {
        Code = code;
    }

    /// <summary>The futures month letter (F for January … Z for December).</summary>
    [UsedImplicitly] public string Code { get; }

    /// <summary>The calendar month number, 1 to 12.</summary>
    [UsedImplicitly] public int Month => (int)Value;

    /// <summary>The month whose futures letter is <paramref name="code" />, ignoring case.</summary>
    [UsedImplicitly]
    public static bool TryFromCode(string? code, [NotNullWhen(true)] out ContractMonth? month)
    {
        month = string.IsNullOrEmpty(code)
            ? null
            : Enumerations.Values.FirstOrDefault(x =>
                x.Value != ContractMonthValue.None && x.Code.Equals(code, StringComparison.OrdinalIgnoreCase));
        return month != null;
    }

    private sealed record Unspecified() : ContractMonth(ContractMonthValue.None, string.Empty, string.Empty);

    private sealed record January() : ContractMonth(ContractMonthValue.Jan, "Jan", "F");

    private sealed record February() : ContractMonth(ContractMonthValue.Feb, "Feb", "G");

    private sealed record March() : ContractMonth(ContractMonthValue.Mar, "Mar", "H");

    private sealed record April() : ContractMonth(ContractMonthValue.Apr, "Apr", "J");

    private sealed record MayMonth() : ContractMonth(ContractMonthValue.May, "May", "K");

    private sealed record June() : ContractMonth(ContractMonthValue.Jun, "Jun", "M");

    private sealed record July() : ContractMonth(ContractMonthValue.Jul, "Jul", "N");

    private sealed record August() : ContractMonth(ContractMonthValue.Aug, "Aug", "Q");

    private sealed record September() : ContractMonth(ContractMonthValue.Sep, "Sep", "U");

    private sealed record October() : ContractMonth(ContractMonthValue.Oct, "Oct", "V");

    private sealed record November() : ContractMonth(ContractMonthValue.Nov, "Nov", "X");

    private sealed record December() : ContractMonth(ContractMonthValue.Dec, "Dec", "Z");
}
