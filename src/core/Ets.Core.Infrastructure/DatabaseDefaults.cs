namespace Ets.Core.Infrastructure;

/// <summary>
///     PostgreSQL column types and defaults shared by every module's EF Core maps (ADR-0010).
/// </summary>
public static class DatabaseDefaults
{
    /// <summary>Maximum length of a person's name or identity in an audit column.</summary>
    public const int MaxLengthName = 200;

    /// <summary>Maximum length of a stored enum member name.</summary>
    public const int MaxLengthEnum = 64;

    /// <summary>Every instant — stored as UTC.</summary>
    public const string TypeTimestamp = "timestamptz";

    /// <summary>Market-local dates (trading days, contract periods) — never a midnight timestamp.</summary>
    public const string TypeDate = "date";

    /// <summary>Money and prices: 18 digits, 6 decimals ($/MWh to the cent and below, before rounding).</summary>
    public const string TypeMoney = "numeric(18,6)";

    /// <summary>Energy volume (MWh) and capacity (MW).</summary>
    public const string TypeVolume = "numeric(18,6)";

    /// <summary>Semi-structured payloads that no query filters on.</summary>
    public const string TypeJson = "jsonb";

    public const string FunctionNow = "now()";
}
