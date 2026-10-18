using Ets.Core.Domain.Models;
using Ets.Core.Domain.ValueObjects;

namespace Ets.Core.Domain.Services;

[UsedImplicitly]
public interface IHolidayCalendarService
{
    /// <summary>
    ///     Gets a list of holidays in a particular calendar year and optionally for a state
    /// </summary>
    /// <param name="year">The calendar year to get holidays for</param>
    /// <param name="holidayState">
    ///     An optional <see cref="HolidayState" /> for which to get the holidays. If <code>null</code>
    ///     only retrieves state-independent holidays.
    /// </param>
    /// <returns>
    ///     An enumerable list of <see cref="Holiday" /> objects representing the holidays in the specified year and
    ///     state.
    /// </returns>
    IEnumerable<Holiday> GetHolidays(int year, HolidayState? holidayState = null);

    /// <summary>
    ///     Gets a list of holidays between two dates, optionally for a state.
    /// </summary>
    /// <param name="startDate">The start date (inclusive) of the range to get holidays for.</param>
    /// <param name="endDate">The end date (inclusive) of the range to get holidays for.</param>
    /// <param name="holidayState">
    ///     An optional <see cref="HolidayState" /> for which to get the holidays. If <code>null</code>
    ///     only retrieves state-independent holidays.
    /// </param>
    /// <returns>
    ///     An enumerable list of <see cref="Holiday" /> objects representing the holidays in the specified range and
    ///     state.
    /// </returns>
    IEnumerable<Holiday> GetHolidays(DateOnly startDate, DateOnly endDate, HolidayState? holidayState = null);

    /// <summary>
    ///     Gets a list of holidays between two dates, optionally for a state.
    /// </summary>
    /// <param name="dateRange">The date range to get holidays for.</param>
    /// <param name="holidayState">
    ///     >An optional <see cref="HolidayState" /> for which to get the holidays. If <code>null</code>
    ///     only retrieves state-independent holidays.
    /// </param>
    /// <returns>
    ///     >An enumerable list of <see cref="Holiday" /> objects representing the holidays in the specified range and
    ///     state.
    /// </returns>
    IEnumerable<Holiday> GetHolidays(DateRange dateRange, HolidayState? holidayState = null)
    {
        ArgumentNullException.ThrowIfNull(dateRange);
        return GetHolidays(dateRange.StartDate, dateRange.EndDate, holidayState);
    }

    /// <summary>
    ///     Checks whether a given date is a holiday in the specified state or if no state is specified, in state-independent
    ///     holidays.
    /// </summary>
    /// <param name="checkDate">The date to check.</param>
    /// <param name="holidayState">
    ///     An optional <see cref="HolidayState" /> to check for. If <code>null</code> only checks
    ///     state-independent holidays.
    /// </param>
    /// <returns>><code>true</code> if the date is a holiday; otherwise, <code>false</code>.</returns>
    bool IsHoliday(DateOnly checkDate, HolidayState? holidayState)
    {
        return IsHoliday(checkDate, holidayState, out _);
    }

    /// <summary>
    ///     Checks whether a given date is a holiday in the specified state or if no state is specified, in state-independent
    ///     holidays.
    /// </summary>
    /// <param name="checkDate">The date to check.</param>
    /// <param name="holidayState">
    ///     An optional <see cref="HolidayState" /> to check for. If <code>null</code> only checks
    ///     state-independent holidays.
    /// </param>
    /// <param name="holidays">
    ///     >An enumerable list of <see cref="Holiday" /> objects representing the holidays that fall on the
    ///     specified date.
    /// </param>
    /// <returns>><code>true</code> if the date is a holiday; otherwise, <code>false</code>.</returns>
    bool IsHoliday(DateOnly checkDate, HolidayState? holidayState, out IEnumerable<Holiday> holidays);

    // Async API - Future-proof for async scenarios while maintaining synchronous performance

    /// <summary>
    ///     Asynchronously gets a list of holidays in a particular calendar year and optionally for a state.
    ///     Currently executes synchronously but provides async API for future extension.
    /// </summary>
    /// <param name="year">The calendar year to get holidays for</param>
    /// <param name="holidayState">
    ///     An optional <see cref="HolidayState" /> for which to get the holidays. If <code>null</code>
    ///     only retrieves state-independent holidays.
    /// </param>
    /// <param name="cancellationToken">Optional cancellation token.</param>
    /// <returns>
    ///     A <see cref="ValueTask" /> representing the asynchronous operation, containing an enumerable list of
    ///     <see cref="Holiday" /> objects.
    /// </returns>
    ValueTask<IEnumerable<Holiday>> GetHolidaysAsync(int year, HolidayState? holidayState = null, CancellationToken cancellationToken = default);

    /// <summary>
    ///     Asynchronously gets a list of holidays between two dates, optionally for a state.
    ///     Currently executes synchronously but provides async API for future extension.
    /// </summary>
    /// <param name="startDate">The start date (inclusive) of the range to get holidays for.</param>
    /// <param name="endDate">The end date (inclusive) of the range to get holidays for.</param>
    /// <param name="holidayState">
    ///     An optional <see cref="HolidayState" /> for which to get the holidays. If <code>null</code>
    ///     only retrieves state-independent holidays.
    /// </param>
    /// <param name="cancellationToken">Optional cancellation token.</param>
    /// <returns>
    ///     A <see cref="ValueTask" /> representing the asynchronous operation, containing an enumerable list of
    ///     <see cref="Holiday" /> objects.
    /// </returns>
    ValueTask<IEnumerable<Holiday>> GetHolidaysAsync(DateOnly startDate, DateOnly endDate, HolidayState? holidayState = null, CancellationToken cancellationToken = default);

    /// <summary>
    ///     Asynchronously gets a list of holidays between two dates, optionally for a state.
    ///     Currently executes synchronously but provides async API for future extension.
    /// </summary>
    /// <param name="dateRange">The date range to get holidays for.</param>
    /// <param name="holidayState">
    ///     >An optional <see cref="HolidayState" /> for which to get the holidays. If <code>null</code>
    ///     only retrieves state-independent holidays.
    /// </param>
    /// <param name="cancellationToken">Optional cancellation token.</param>
    /// <returns>
    ///     A <see cref="ValueTask" /> representing the asynchronous operation, containing an enumerable list of
    ///     <see cref="Holiday" /> objects.
    /// </returns>
    ValueTask<IEnumerable<Holiday>> GetHolidaysAsync(DateRange dateRange, HolidayState? holidayState = null, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(dateRange);
        return GetHolidaysAsync(dateRange.StartDate, dateRange.EndDate, holidayState, cancellationToken);
    }

    /// <summary>
    ///     Asynchronously checks whether a given date is a holiday in the specified state or if no state is specified, in
    ///     state-independent holidays.
    ///     Currently executes synchronously but provides async API for future extension.
    /// </summary>
    /// <param name="checkDate">The date to check.</param>
    /// <param name="holidayState">
    ///     An optional <see cref="HolidayState" /> to check for. If <code>null</code> only checks
    ///     state-independent holidays.
    /// </param>
    /// <param name="cancellationToken">Optional cancellation token.</param>
    /// <returns>
    ///     A <see cref="ValueTask" /> representing the asynchronous operation, containing a tuple with the result and
    ///     associated holidays.
    /// </returns>
    ValueTask<(bool IsHoliday, IEnumerable<Holiday> Holidays)> IsHolidayAsync(DateOnly checkDate, HolidayState? holidayState, CancellationToken cancellationToken = default);

    // Enhanced Query APIs

    /// <summary>
    ///     Gets holidays for multiple years in a single call, optimized for batch processing.
    /// </summary>
    /// <param name="years">The years to retrieve holidays for.</param>
    /// <param name="holidayState">
    ///     An optional <see cref="HolidayState" /> for which to get the holidays. If <code>null</code>
    ///     only retrieves state-independent holidays.
    /// </param>
    /// <returns>A dictionary mapping each year to its holidays.</returns>
    IReadOnlyDictionary<int, IReadOnlyList<Holiday>> GetHolidaysByYears(IEnumerable<int> years, HolidayState? holidayState = null);

    /// <summary>
    ///     Gets a specific holiday by name and year.
    /// </summary>
    /// <param name="name">The name of the holiday to find (case-insensitive).</param>
    /// <param name="year">The year to search in.</param>
    /// <param name="holidayState">
    ///     An optional <see cref="HolidayState" /> to filter by. If <code>null</code> searches
    ///     state-independent holidays.
    /// </param>
    /// <returns>The holiday if found; otherwise, <code>null</code>.</returns>
    Holiday? GetHolidayByName(string name, int year, HolidayState? holidayState = null);

    /// <summary>
    ///     Gets the next holiday on or after the specified date.
    /// </summary>
    /// <param name="fromDate">The date to start searching from (inclusive).</param>
    /// <param name="holidayState">
    ///     An optional <see cref="HolidayState" /> to filter by. If <code>null</code> searches
    ///     state-independent holidays.
    /// </param>
    /// <returns>The next holiday if found; otherwise, <code>null</code>.</returns>
    Holiday? GetNextHoliday(DateOnly fromDate, HolidayState? holidayState = null);
}
