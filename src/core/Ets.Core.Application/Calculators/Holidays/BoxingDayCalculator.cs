using Ets.Core.Application.Models.Holidays;
using Ets.Core.Domain.Models;
using Ets.Core.Domain.ValueObjects;

namespace Ets.Core.Application.Calculators.Holidays;

internal class BoxingDayCalculator : HolidayCalculatorBase
{
    public override IEnumerable<Holiday> CalculateHolidays(int year, HolidayState? holidayState)
    {
        // country-wide holiday on 26 December
        // In South Australia this holiday is named "Proclamation Day Holiday" per the Public Holidays Act 2023 (SA)
        // All other states observe it as "Boxing Day"
        // Substitute rules (to avoid collision with Christmas Day substitution):
        //   If Saturday → observed Monday
        //   If Sunday or Monday → observed Tuesday
        string holidayName = holidayState == HolidayState.SA ? "Proclamation Day Holiday" : "Boxing Day";
        var holiday = new DateOnly(year, 12, 26);
        yield return new Holiday(holidayState, holiday, holidayName);

        if (holiday.DayOfWeek == DayOfWeek.Saturday)
        {
            yield return new Holiday(holidayState, MondayIfWeekend(holiday), holidayName, true);
        }
        else if (holiday.DayOfWeek is DayOfWeek.Sunday or DayOfWeek.Monday)
        {
            yield return new Holiday(holidayState, NthWeekdayOnOrAfter(1, DayOfWeek.Tuesday, holiday), holidayName, true);
        }
    }
}
