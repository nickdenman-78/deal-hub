using Ets.Core.Domain.ValueObjects;

namespace Ets.Modules.Deals.Domain.ValueObjects;

/// <summary>
///     The period an ASX electricity futures contract is listed for. Months (base load only) and quarters are
///     single contracts; a strip is a calendar or financial year of four quarterly contracts, traded as one.
/// </summary>
public abstract record ContractPeriod : Enumeration<ContractPeriodValue, ContractPeriod>
{
    [UsedImplicitly] public static readonly ContractPeriod None = new UnspecifiedPeriod();
    [UsedImplicitly] public static readonly ContractPeriod Month = new MonthPeriod();
    [UsedImplicitly] public static readonly ContractPeriod Quarter = new QuarterPeriod();
    [UsedImplicitly] public static readonly ContractPeriod Strip = new StripPeriod();

    private ContractPeriod(ContractPeriodValue value, string name, string description) : base(value, name)
    {
        Description = description;
    }

    [UsedImplicitly] public string Description { get; }

    private sealed record UnspecifiedPeriod() : ContractPeriod(ContractPeriodValue.None, string.Empty, string.Empty);

    private sealed record MonthPeriod() : ContractPeriod(ContractPeriodValue.Month, "Month", "A calendar month");

    private sealed record QuarterPeriod() : ContractPeriod(ContractPeriodValue.Quarter, "Quarter", "A calendar quarter");

    private sealed record StripPeriod() : ContractPeriod(
        ContractPeriodValue.Strip,
        "Strip",
        "A calendar or financial year of four quarterly contracts, traded as one");
}
