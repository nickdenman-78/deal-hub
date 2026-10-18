using Ets.Core.Domain.Services;
using Ets.Core.Domain.Specifications;

namespace Ets.Core.Application.Services;

/// <summary>
///     A clock that reports one instant for its whole lifetime.
/// </summary>
/// <remarks>
///     Registered per scope, so every timestamp within one request or message — event <c>OccurredAt</c>,
///     audit columns, business dates — is the same instant. Tests construct it with a fixed time.
/// </remarks>
public sealed class FrozenDateTimeProvider : IDateTimeProvider
{
    private readonly DateTimeOffset _fixedTime;

    [UsedImplicitly]
    public FrozenDateTimeProvider(DateTimeOffset fixedTime)
    {
        _fixedTime = fixedTime;
    }

    [UsedImplicitly]
    public FrozenDateTimeProvider(IDateTimeProvider dateTimeProvider)
    {
        ArgumentNullException.ThrowIfNull(dateTimeProvider);
        _fixedTime = dateTimeProvider.UtcNow;
    }

    /// <summary>Freezes the current instant.</summary>
    [UsedImplicitly]
    public FrozenDateTimeProvider() : this(DateTimeOffset.UtcNow)
    {
    }

    public DateTimeOffset UtcNow => _fixedTime.ToUniversalTime();

    public DateTimeOffset Now => _fixedTime.ToOffset(MarketTime.Offset);
}
