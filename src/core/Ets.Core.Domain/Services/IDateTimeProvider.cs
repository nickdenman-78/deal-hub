using Ets.Core.Domain.Specifications;

namespace Ets.Core.Domain.Services;

/// <summary>
///     The clock. Domain and application code never read <c>DateTime.Now</c> or <c>UtcNow</c> directly.
/// </summary>
public interface IDateTimeProvider
{
    /// <summary>The current instant in NEM market time (AEST, UTC+10, no daylight saving).</summary>
    DateTimeOffset Now { get; }

    /// <summary>The current instant in UTC.</summary>
    DateTimeOffset UtcNow { get; }

    /// <summary>The current NEM trading date.</summary>
    DateOnly Today => DateOnly.FromDateTime(UtcNow.ToOffset(MarketTime.Offset).DateTime);
}
