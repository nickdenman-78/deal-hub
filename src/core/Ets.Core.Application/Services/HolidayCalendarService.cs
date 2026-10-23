using System.Collections.Concurrent;
using System.Collections.Frozen;
using System.Diagnostics;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Ets.Core.Application.Models.Holidays;
using Ets.Core.Application.Options;
using Ets.Core.Domain;
using Ets.Core.Domain.Models;
using Ets.Core.Domain.Services;
using Ets.Core.Domain.ValueObjects;

namespace Ets.Core.Application.Services;

/// <summary>
///     Service for retrieving Australian public holidays based on year and state/territory.
///     Implements configurable caching for improved performance on repeated queries.
/// </summary>
internal sealed partial class HolidayCalendarService : IHolidayCalendarService
{
    private static readonly FrozenSet<HolidayCalculatorBase> Calculators = typeof(HolidayCalculatorBase)
        .GetDerivedTypes(AppDomain.CurrentDomain.GetAssemblies())
        .Select(t => (HolidayCalculatorBase)Activator.CreateInstance(t)!)
        .ToFrozenSet();

    // Cache computed holidays by year and state for improved performance
    private readonly ConcurrentDictionary<(int Year, HolidayState? State), CacheEntry> _holidayCache = new();
    private readonly ILogger<HolidayCalendarService> _logger;

    private readonly HolidayServiceOptions _options;
    private readonly IDateTimeProvider _timeService;

    /// <summary>
    ///     Initializes a new instance of the <see cref="HolidayCalendarService" /> class.
    /// </summary>
    /// <param name="timeService">The time service for calculating cache expiration.</param>
    /// <param name="options">Configuration options for the service.</param>
    /// <param name="logger">Logger for observability.</param>
    public HolidayCalendarService(
        IDateTimeProvider timeService,
        IOptions<HolidayServiceOptions> options,
        ILogger<HolidayCalendarService> logger)
    {
        ArgumentNullException.ThrowIfNull(options);
        ArgumentNullException.ThrowIfNull(logger);
        _options = options.Value;
        _timeService = timeService;
        _logger = logger;
        _options.Validate();

        LogInitialized(_logger, Calculators.Count, _options.EnableCaching, _options.MaxCacheSize);
    }

    /// <summary>
    ///     Gets all holidays for a specific year, optionally filtered by state/territory.
    ///     Results are cached for improved performance on repeated queries.
    /// </summary>
    /// <param name="year">The year to retrieve holidays for (1970-2100).</param>
    /// <param name="holidayState">Optional state/territory filter. Null returns all national holidays.</param>
    /// <returns>An enumerable of holidays, ordered by date.</returns>
    /// <exception cref="ArgumentOutOfRangeException">Thrown when year is outside valid range (1970-2100).</exception>
    public IEnumerable<Holiday> GetHolidays(int year, HolidayState? holidayState = null)
    {
        ArgumentOutOfRangeException.ThrowIfLessThan(year, 1970);
        ArgumentOutOfRangeException.ThrowIfGreaterThan(year, 2100);

        if (Calculators.Count == 0)
        {
            LogNoCalculatorsFound(_logger);
            return [];
        }

        var sw = Stopwatch.StartNew();

        // If caching is disabled, calculate directly
        if (!_options.EnableCaching)
        {
            var result = CalculateHolidays(year, holidayState);
            sw.Stop();
            LogRetrievedNoCache(_logger, result.Count, year, holidayState?.Name ?? "All", sw.ElapsedMilliseconds);
            return result;
        }

        var cacheKey = (year, holidayState);

        // Check if cached entry exists and is still valid
        if (_holidayCache.TryGetValue(cacheKey, out var cachedEntry))
        {
            // Check expiration if configured
            if (_options.CacheExpiration is { } expiration)
            {
                var age = _timeService.Now - cachedEntry.CreatedAt;
                if (age > expiration)
                {
                    // Entry expired, remove and recalculate
                    _holidayCache.TryRemove(cacheKey, out _);
                    LogCacheEntryExpired(_logger, year, holidayState?.Name ?? "All");
                }
                else
                {
                    sw.Stop();
                    LogCacheHit(_logger, year, holidayState?.Name ?? "All", cachedEntry.Holidays.Count, sw.ElapsedMilliseconds);
                    return cachedEntry.Holidays;
                }
            }
            else
            {
                sw.Stop();
                LogCacheHit(_logger, year, holidayState?.Name ?? "All", cachedEntry.Holidays.Count, sw.ElapsedMilliseconds);
                return cachedEntry.Holidays;
            }
        }

        // Calculate and cache
        var holidays = CalculateHolidays(year, holidayState);
        var entry = new CacheEntry(_timeService, holidays);

        // Respect max cache size
        if (_options.MaxCacheSize > 0 && _holidayCache.Count >= _options.MaxCacheSize)
        {
            // Simple eviction: remove oldest entry
            var oldestKey = _holidayCache.OrderBy(kvp => kvp.Value.CreatedAt).FirstOrDefault().Key;
            _holidayCache.TryRemove(oldestKey, out _);
            LogCacheEviction(_logger, oldestKey.Year, oldestKey.State?.Name ?? "All");
        }

        _holidayCache.TryAdd(cacheKey, entry);
        sw.Stop();
        LogCacheMiss(_logger, year, holidayState?.Name ?? "All", holidays.Count, sw.ElapsedMilliseconds);
        return holidays;
    }

    /// <summary>
    ///     Gets all holidays within a specified date range, optionally filtered by state/territory.
    ///     Automatically corrects reversed date ranges and leverages caching for performance.
    ///     Optimized to avoid materializing unnecessary holidays at year boundaries.
    /// </summary>
    /// <param name="startDate">The start date of the range (inclusive).</param>
    /// <param name="endDate">The end date of the range (inclusive).</param>
    /// <param name="holidayState">Optional state/territory filter. Null returns all national holidays.</param>
    /// <returns>An enumerable of holidays within the date range, ordered by date.</returns>
    public IEnumerable<Holiday> GetHolidays(DateOnly startDate, DateOnly endDate, HolidayState? holidayState = null)
    {
        if (startDate > endDate)
        {
            (startDate, endDate) = (endDate, startDate);
        }

        int startYear = startDate.Year;
        int endYear = endDate.Year;

        // For single year ranges, use direct filtering (most common case)
        if (startYear == endYear)
        {
            return GetHolidays(startYear, holidayState)
                .Where(h => h.Date >= startDate && h.Date <= endDate);
        }

        // For multi-year ranges, process partial years separately to minimize filtering
        var holidays = new List<Holiday>();

        // First partial year - filter holidays on or after start date
        holidays.AddRange(GetHolidays(startYear, holidayState).Where(h => h.Date >= startDate));

        // Full years in between - no filtering needed
        for (int year = startYear + 1; year < endYear; year++)
        {
            holidays.AddRange(GetHolidays(year, holidayState));
        }

        // Last partial year - filter holidays on or before end date
        holidays.AddRange(GetHolidays(endYear, holidayState).Where(h => h.Date <= endDate));

        // Results are already ordered by year, and within each year by date (from cache)
        // No need to sort again since we're adding in chronological order
        return holidays;
    }

    /// <summary>
    ///     Checks if a specific date is a holiday, optionally filtered by state/territory.
    /// </summary>
    /// <param name="checkDate">The date to check.</param>
    /// <param name="holidayState">Optional state/territory filter. Null checks all national holidays.</param>
    /// <param name="holidays">Output parameter containing any holidays found on the specified date.</param>
    /// <returns>True if the date is a holiday; otherwise, false.</returns>
    public bool IsHoliday(DateOnly checkDate, HolidayState? holidayState, out IEnumerable<Holiday> holidays)
    {
        holidays = GetHolidays(checkDate, checkDate, holidayState);
        return holidays.Any();
    }

    // Async API implementations - Currently execute synchronously using ValueTask for efficient sync path

    /// <summary>
    ///     Asynchronously gets all holidays for a specific year, optionally filtered by state/territory.
    ///     Currently executes synchronously via ValueTask for efficient performance.
    ///     Results are cached for improved performance on repeated queries.
    /// </summary>
    /// <param name="year">The year to retrieve holidays for (1970-2100).</param>
    /// <param name="holidayState">Optional state/territory filter. Null returns all national holidays.</param>
    /// <param name="cancellationToken">Optional cancellation token.</param>
    /// <returns>A ValueTask containing an enumerable of holidays, ordered by date.</returns>
    /// <exception cref="ArgumentOutOfRangeException">Thrown when year is outside valid range (1970-2100).</exception>
    public ValueTask<IEnumerable<Holiday>> GetHolidaysAsync(int year, HolidayState? holidayState = null,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var result = GetHolidays(year, holidayState);
        return ValueTask.FromResult(result);
    }

    /// <summary>
    ///     Asynchronously gets all holidays within a specified date range, optionally filtered by state/territory.
    ///     Currently executes synchronously via ValueTask for efficient performance.
    ///     Automatically corrects reversed date ranges and leverages caching for performance.
    /// </summary>
    /// <param name="startDate">The start date of the range (inclusive).</param>
    /// <param name="endDate">The end date of the range (inclusive).</param>
    /// <param name="holidayState">Optional state/territory filter. Null returns all national holidays.</param>
    /// <param name="cancellationToken">Optional cancellation token.</param>
    /// <returns>A ValueTask containing an enumerable of holidays within the date range, ordered by date.</returns>
    public ValueTask<IEnumerable<Holiday>> GetHolidaysAsync(DateOnly startDate, DateOnly endDate,
        HolidayState? holidayState = null, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var result = GetHolidays(startDate, endDate, holidayState);
        return ValueTask.FromResult(result);
    }

    /// <summary>
    ///     Asynchronously checks if a specific date is a holiday, optionally filtered by state/territory.
    ///     Currently executes synchronously via ValueTask for efficient performance.
    /// </summary>
    /// <param name="checkDate">The date to check.</param>
    /// <param name="holidayState">Optional state/territory filter. Null checks all national holidays.</param>
    /// <param name="cancellationToken">Optional cancellation token.</param>
    /// <returns>A ValueTask containing a tuple with a boolean indicating if it's a holiday and the associated holidays.</returns>
    public async ValueTask<(bool IsHoliday, IEnumerable<Holiday> Holidays)> IsHolidayAsync(DateOnly checkDate,
        HolidayState? holidayState, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var holidays = await GetHolidaysAsync(checkDate, checkDate, holidayState, cancellationToken)
            .ConfigureAwait(false);
        var holidayList = holidays as IReadOnlyList<Holiday> ?? [.. holidays];
        bool isHoliday = holidayList.Count > 0;
        return (isHoliday, holidayList);
    }

    // Enhanced Query APIs

    /// <summary>
    ///     Gets holidays for multiple years in a single call, optimized for batch processing.
    ///     Efficiently leverages caching when enabled.
    /// </summary>
    /// <param name="years">The years to retrieve holidays for.</param>
    /// <param name="holidayState">Optional state/territory filter. Null returns all national holidays.</param>
    /// <returns>A dictionary mapping each year to its list of holidays.</returns>
    public IReadOnlyDictionary<int, IReadOnlyList<Holiday>> GetHolidaysByYears(IEnumerable<int> years,
        HolidayState? holidayState = null)
    {
        ArgumentNullException.ThrowIfNull(years);

        var result = new Dictionary<int, IReadOnlyList<Holiday>>();

        foreach (int year in years)
        {
            var holidays = GetHolidays(year, holidayState).ToList();
            result[year] = holidays;
        }

        return result;
    }

    /// <summary>
    ///     Gets a specific holiday by name and year.
    ///     Search is case-insensitive.
    /// </summary>
    /// <param name="name">The name of the holiday to find.</param>
    /// <param name="year">The year to search in.</param>
    /// <param name="holidayState">Optional state/territory filter. Null searches state-independent holidays.</param>
    /// <returns>The holiday if found; otherwise, null.</returns>
    public Holiday? GetHolidayByName(string name, int year, HolidayState? holidayState = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);

        return GetHolidays(year, holidayState)
            .FirstOrDefault(h => h.Name.Equals(name, StringComparison.OrdinalIgnoreCase));
    }

    /// <summary>
    ///     Gets the next holiday on or after the specified date.
    ///     Searches up to 2 years ahead to find the next holiday.
    /// </summary>
    /// <param name="fromDate">The date to start searching from (inclusive).</param>
    /// <param name="holidayState">Optional state/territory filter. Null searches state-independent holidays.</param>
    /// <returns>The next holiday if found within 2 years; otherwise, null.</returns>
    public Holiday? GetNextHoliday(DateOnly fromDate, HolidayState? holidayState = null)
    {
        // Search current year first
        var currentYearHolidays = GetHolidays(fromDate.Year, holidayState)
            .Where(h => h.Date >= fromDate)
            .OrderBy(h => h.Date);

        var nextHoliday = currentYearHolidays.FirstOrDefault();
        if (nextHoliday != null)
        {
            return nextHoliday;
        }

        // If no holiday found in current year, search next year
        var nextYearHolidays = GetHolidays(fromDate.Year + 1, holidayState)
            .OrderBy(h => h.Date);

        return nextYearHolidays.FirstOrDefault();
    }

    private static List<Holiday> CalculateHolidays(int year, HolidayState? holidayState)
    {
        return
        [
            .. Calculators
                .SelectMany(calculator => calculator.CalculateHolidays(year, holidayState))
                .OrderBy(holiday => holiday.Date)
        ];
    }

    [LoggerMessage(EventId = 1000, Level = LogLevel.Information, Message = "HolidayCalendarService initialized with {CalculatorCount} calculators. Caching: {CachingEnabled}, MaxCacheSize: {MaxCacheSize}")]
    private static partial void LogInitialized(ILogger logger, int calculatorCount, bool cachingEnabled, int maxCacheSize);

    [LoggerMessage(EventId = 1001, Level = LogLevel.Warning, Message = "No holiday calculators found")]
    private static partial void LogNoCalculatorsFound(ILogger logger);

    [LoggerMessage(EventId = 1002, Level = LogLevel.Debug, Message = "Retrieved {HolidayCount} holidays for year {Year} and state {State} in {ElapsedMs}ms (cache disabled)")]
    private static partial void LogRetrievedNoCache(ILogger logger, int holidayCount, int year, string state, long elapsedMs);

    [LoggerMessage(EventId = 1003, Level = LogLevel.Debug, Message = "Cache entry expired for year {Year}, state {State}")]
    private static partial void LogCacheEntryExpired(ILogger logger, int year, string state);

    [LoggerMessage(EventId = 1004, Level = LogLevel.Debug, Message = "Cache hit for year {Year}, state {State} - {HolidayCount} holidays returned in {ElapsedMs}ms")]
    private static partial void LogCacheHit(ILogger logger, int year, string state, int holidayCount, long elapsedMs);

    [LoggerMessage(EventId = 1005, Level = LogLevel.Debug, Message = "Cache eviction: removed entry for year {Year}, state {State}")]
    private static partial void LogCacheEviction(ILogger logger, int year, string state);

    [LoggerMessage(EventId = 1006, Level = LogLevel.Debug, Message = "Cache miss for year {Year}, state {State} - calculated {HolidayCount} holidays in {ElapsedMs}ms")]
    private static partial void LogCacheMiss(ILogger logger, int year, string state, int holidayCount, long elapsedMs);

    private sealed class CacheEntry(IDateTimeProvider timeService, IReadOnlyList<Holiday> holidays)
    {
        public IReadOnlyList<Holiday> Holidays { get; } = holidays;
        public DateTimeOffset CreatedAt { get; } = timeService.Now;
    }
}
