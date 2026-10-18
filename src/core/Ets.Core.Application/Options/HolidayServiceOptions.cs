namespace Ets.Core.Application.Options;

/// <summary>
///     Configuration options for the Holiday Calendar Service.
/// </summary>
internal sealed class HolidayServiceOptions
{
    /// <summary>The configuration section the holiday calendar binds.</summary>
    public const string SectionName = "Holidays";

    /// <summary>
    ///     Gets or sets a value indicating whether caching is enabled.
    ///     When enabled, holiday calculations are cached by year and state for improved performance.
    ///     Default: true.
    /// </summary>
    public bool EnableCaching { get; set; } = true;

    /// <summary>
    ///     Gets or sets the maximum number of cached year/state combinations.
    ///     Helps limit memory usage for long-running applications.
    ///     Set to 0 for unlimited cache size.
    ///     Default: 1000 (approximately 7-8 years × all states × cache variations).
    /// </summary>
    public int MaxCacheSize { get; set; } = 1000;

    /// <summary>
    ///     Gets or sets the cache expiration time.
    ///     When set, cached entries older than this duration will be considered stale.
    ///     Set to null for no expiration (cache never expires).
    ///     Default: null (no expiration - holiday calculations are deterministic).
    /// </summary>
    /// <remarks>
    ///     For holiday calculations, expiration is typically not needed since results are deterministic.
    ///     However, this option is provided for scenarios where periodic cache invalidation is desired.
    /// </remarks>
    public TimeSpan? CacheExpiration { get; set; }

    /// <summary>
    ///     Validates the options' configuration.
    /// </summary>
    /// <exception cref="ArgumentOutOfRangeException">Thrown when MaxCacheSize is negative.</exception>
    internal void Validate()
    {
        ArgumentOutOfRangeException.ThrowIfLessThan(MaxCacheSize, 0);

        if (CacheExpiration is { } expiration && expiration <= TimeSpan.Zero)
        {
            ArgumentOutOfRangeException.ThrowIfLessThan(expiration, TimeSpan.Zero);
        }
    }
}
