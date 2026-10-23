using Ets.Core.Application.Models.Holidays;
using Ets.Core.Domain.Models;
using Ets.Core.Domain.ValueObjects;

namespace Ets.Core.Application.Calculators.Holidays;

internal class MelbourneCupCalculator : HolidayCalculatorBase
{
    public override IEnumerable<Holiday> CalculateHolidays(int year, HolidayState? holidayState)
    {
        if (holidayState != HolidayState.VIC)
        {
            yield break;
        }

        // Melbourne Cup Day is on the first Tuesday in November
        var holiday = NthWeekdayOnOrAfter(1, DayOfWeek.Tuesday, new DateOnly(year, 11, 1));

        yield return new Holiday(holidayState, holiday, "Melbourne Cup Day");
    }
}
