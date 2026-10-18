using Ets.Core.Application.Models.Holidays;
using Ets.Core.Domain.Models;
using Ets.Core.Domain.ValueObjects;

namespace Ets.Core.Application.Calculators.Holidays;

internal class PicnicDayCalculator : HolidayCalculatorBase
{
    public override IEnumerable<Holiday> CalculateHolidays(int year, HolidayState? holidayState)
    {
        if (holidayState != HolidayState.NT)
        {
            yield break;
        }

        // Picnic Day is observed in Australia’s Northern Territory on the first Monday of August each year
        var holiday = NthWeekdayOnOrAfter(1, DayOfWeek.Monday, new DateOnly(year, 8, 1));
        yield return new Holiday(holidayState, holiday, "Picnic Day");
    }
}
