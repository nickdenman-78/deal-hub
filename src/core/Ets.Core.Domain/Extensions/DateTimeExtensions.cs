using System.Collections.ObjectModel;
using Ets.Core.Domain.Models;

namespace Ets.Core.Domain;

public static class DateTimeExtensions
{
    /// <summary>
    ///     Adds or subtracts business days from a date, taking only weekends into account
    /// </summary>
    /// <param name="startDate">The start date</param>
    /// <param name="businessDays">The number of business days to add (positive number) or to subtract (negative number)</param>
    /// <returns>The resulting date</returns>
    [UsedImplicitly]
    public static DateTime AddBusinessDays(this DateTime startDate, int businessDays)
    {
        return startDate.AddBusinessDays(businessDays, []);
    }

    /// <summary>
    ///     Adds or subtracts business days from a date, taking weekends and holidays into account
    /// </summary>
    /// <param name="startDate">The start date</param>
    /// <param name="businessDays">The number of business days to add (positive number) or to subtract (negative number)</param>
    /// <param name="holidays">The collection of holidays to consider</param>
    /// <returns>The resulting date</returns>
    [UsedImplicitly]
    public static DateTime AddBusinessDays(this DateTime startDate, int businessDays, Collection<Holiday> holidays)
    {
        int sign = Math.Sign(businessDays);
        int unsignedBusinessDays = Math.Abs(businessDays);
        var result = startDate;

        while (unsignedBusinessDays > 0)
        {
            result = result.AddDays(sign);

            if (result.DayOfWeek != DayOfWeek.Saturday &&
                result.DayOfWeek != DayOfWeek.Sunday &&
                holidays.All(h => h.Date != DateOnly.FromDateTime(result.Date)))
            {
                unsignedBusinessDays--;
            }
        }

        return result;
    }
}
