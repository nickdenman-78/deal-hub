using Ets.Core.Domain.Services;
using Ets.Core.Domain.Specifications;

namespace Ets.Core.Application.Services;

/// <summary>
///     The system clock, reported in NEM market time.
/// </summary>
/// <remarks>
///     <see cref="Now" /> is AEST (UTC+10) regardless of the host's own time zone, so a host in Adelaide, a
///     container in UTC and a developer laptop in Sydney during daylight saving all agree on the trading day.
/// </remarks>
public sealed class DateTimeProvider : IDateTimeProvider
{
    /// <inheritdoc />
    public DateTimeOffset Now => DateTimeOffset.UtcNow.ToOffset(MarketTime.Offset);

    /// <inheritdoc />
    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
}
