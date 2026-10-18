using Ets.Core.Domain.Models;
using Ets.Core.Domain.ValueObjects;

namespace Ets.Core.Application.Models.Holidays;

/// <summary>
///     Base class for holiday calculators that provides common date calculation utilities.
///     Each derived calculator is responsible for calculating holidays for a specific holiday type.
/// </summary>
internal abstract class HolidayCalculatorBase
{
    /// <summary>
    ///     Calculates holidays for the specified year and optional state/territory.
    ///     This method is called via reflection by the holiday calendar service.
    /// </summary>
    /// <param name="year">The year to calculate holidays for.</param>
    /// <param name="holidayState">Optional state/territory filter.</param>
    /// <returns>An enumerable of holidays calculated by this calculator.</returns>
    [UsedImplicitly]
    public abstract IEnumerable<Holiday> CalculateHolidays(int year, HolidayState? holidayState);

    /// <summary>
    ///     Finds the first occurrence of a specified day of week on or after a given date.
    ///     Optimized using arithmetic instead of iteration.
    /// </summary>
    /// <param name="dayOfWeek">The target day of week to find.</param>
    /// <param name="onOrAfter">The date to start searching from (inclusive).</param>
    /// <returns>The first occurrence of the specified day of week.</returns>
    protected static DateOnly First(DayOfWeek dayOfWeek, DateOnly onOrAfter)
    {
        int currentDay = (int)onOrAfter.DayOfWeek;
        int targetDay = (int)dayOfWeek;
        int daysToAdd = (targetDay - currentDay + 7) % 7;
        return onOrAfter.AddDays(daysToAdd);
    }

    /// <summary>
    ///     Checks if a date falls on a specific day of the week.
    /// </summary>
    /// <param name="date">The date to check.</param>
    /// <param name="dayOfWeek">The day of week to check for.</param>
    /// <returns>True if the date falls on the specified day of week; otherwise, false.</returns>
    protected static bool IsDayOfWeek(DateOnly date, DayOfWeek dayOfWeek)
    {
        return date.DayOfWeek == dayOfWeek;
    }

    /// <summary>
    ///     Checks if a date falls on a weekend (Saturday or Sunday).
    /// </summary>
    /// <param name="date">The date to check.</param>
    /// <returns>True if the date is a Saturday or Sunday; otherwise, false.</returns>
    protected static bool IsWeekend(DateOnly date)
    {
        return date.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday;
    }

    /// <summary>
    ///     Adjusts a date to the following Monday if it falls on a weekend.
    ///     Used for observed holiday calculations.
    /// </summary>
    /// <param name="date">The date to adjust.</param>
    /// <returns>The following Monday if the date is a weekend; otherwise, the original date.</returns>
    protected static DateOnly MondayIfWeekend(DateOnly date)
    {
        return date.DayOfWeek switch
        {
            DayOfWeek.Saturday => date.AddDays(2),
            DayOfWeek.Sunday => date.AddDays(1),
            _ => date
        };
    }

    /// <summary>
    ///     Finds the last occurrence of a specified day of week on or before a given date.
    ///     Optimized using arithmetic instead of iteration.
    ///     Currently unused but available for future calculator implementations.
    /// </summary>
    /// <param name="dayOfWeek">The target day of week to find.</param>
    /// <param name="before">The date to start searching from (inclusive).</param>
    /// <returns>The last occurrence of the specified day of week on or before the given date.</returns>
    protected static DateOnly LastWeekdayOnOrBefore(DayOfWeek dayOfWeek, DateOnly before)
    {
        int currentDay = (int)before.DayOfWeek;
        int targetDay = (int)dayOfWeek;
        int daysToSubtract = (currentDay - targetDay + 7) % 7;
        return before.AddDays(-daysToSubtract);
    }

    /// <summary>
    ///     Finds the last occurrence of a specified day of week strictly before a given date.
    ///     Optimized using arithmetic instead of iteration.
    /// </summary>
    /// <param name="dayOfWeek">The target day of week to find.</param>
    /// <param name="before">The date to start searching from (exclusive).</param>
    /// <returns>The last occurrence of the specified day of week before the given date.</returns>
    protected static DateOnly LastWeekdayBefore(DayOfWeek dayOfWeek, DateOnly before)
    {
        var dayBefore = before.AddDays(-1);
        int currentDay = (int)dayBefore.DayOfWeek;
        int targetDay = (int)dayOfWeek;
        int daysToSubtract = (currentDay - targetDay + 7) % 7;
        return dayBefore.AddDays(-daysToSubtract);
    }

    /// <summary>
    ///     Finds the nth occurrence of a specified day of week on or after a given date.
    ///     Optimized using arithmetic instead of iteration.
    /// </summary>
    /// <param name="nth">The occurrence number (1-5, where 1 is the first occurrence).</param>
    /// <param name="dayOfWeek">The target day of week to find.</param>
    /// <param name="onOrFrom">The date to start searching from (inclusive).</param>
    /// <returns>The nth occurrence of the specified day of week.</returns>
    /// <exception cref="ArgumentOutOfRangeException">Thrown when nth is not between 1 and 5.</exception>
    protected static DateOnly NthWeekdayOnOrAfter(int nth, DayOfWeek dayOfWeek, DateOnly onOrFrom)
    {
        ArgumentOutOfRangeException.ThrowIfLessThan(nth, 1);
        ArgumentOutOfRangeException.ThrowIfGreaterThan(nth, 5);

        // Find first occurrence
        var first = First(dayOfWeek, onOrFrom);

        // Add weeks to get nth occurrence
        return first.AddDays((nth - 1) * 7);
    }
}
