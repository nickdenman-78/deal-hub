namespace Ets.Modules.Deals.Infrastructure.Persistence.Entities;

/// <summary>
///     One ASX futures deal as a relational row: the read model behind the deal screens and anything that wants
///     deals in SQL. Written only by <c>AsxFuturesDealsReadModel</c> from the deal's events; the event stream stays
///     the source of truth (ADR-0013), so the table can be dropped and rebuilt from it.
/// </summary>
internal sealed class DbAsxFuturesDeal
{
    /// <summary>The deal id, which is also its event stream id.</summary>
    public Guid Id { get; set; }

    /// <summary>The stream version this row reflects, so replaying an event never moves it backwards.</summary>
    public long Version { get; set; }

    /// <summary>The ASX 24 product code, e.g. <c>BQZ26</c>.</summary>
    public string ProductCode { get; set; } = string.Empty;

    /// <summary>The NEM region code, e.g. <c>QLD</c>.</summary>
    public string Region { get; set; } = string.Empty;

    /// <summary>The load profile's name, e.g. "Base load".</summary>
    public string LoadProfile { get; set; } = string.Empty;

    /// <summary>"Standard" or "$300 cap".</summary>
    public string Payoff { get; set; } = string.Empty;

    /// <summary>"Month", "Quarter" or "Strip".</summary>
    public string Period { get; set; } = string.Empty;

    /// <summary>The term's name, e.g. "Q4 2026".</summary>
    public string Term { get; set; } = string.Empty;

    public DateOnly TermStart { get; set; }

    public DateOnly TermEnd { get; set; }

    /// <summary>The days one lot covers, as ASX listed it when the deal was captured.</summary>
    public int ContractDays { get; set; }

    /// <summary>MWh one lot delivers, as ASX listed it when the deal was captured.</summary>
    public decimal ContractSize { get; set; }

    /// <summary><c>Buy</c> or <c>Sell</c>.</summary>
    public string Direction { get; set; } = string.Empty;

    /// <summary>$/MWh.</summary>
    public decimal Price { get; set; }

    /// <summary>Lots, in MW.</summary>
    public decimal Volume { get; set; }

    /// <summary>Volume x contract size, in MWh.</summary>
    public decimal ContractedEnergy { get; set; }

    public DateTimeOffset CapturedAt { get; set; }
}
