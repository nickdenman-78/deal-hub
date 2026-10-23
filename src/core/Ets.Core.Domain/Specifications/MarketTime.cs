namespace Ets.Core.Domain.Specifications;

/// <summary>
///     NEM market time. The NEM runs on Australian Eastern Standard Time all year: UTC+10, with no daylight
///     saving, whatever the local time in the participant's own state.
/// </summary>
public static class MarketTime
{
    public static readonly TimeSpan Offset = TimeSpan.FromHours(10);

    /// <summary>Converts an instant to market time.</summary>
    [UsedImplicitly]
    public static DateTimeOffset ToMarketTime(this DateTimeOffset instant)
    {
        return instant.ToOffset(Offset);
    }
}
