using Ets.Core.Application.Models.Holidays;
using Ets.Core.Domain.Models;
using Ets.Core.Domain.ValueObjects;

namespace Ets.Core.Application.Calculators.Holidays;

[UsedImplicitly]
internal sealed class AdelaideCupDayCalculator : HolidayCalculatorBase
{
    public override IEnumerable<Holiday> CalculateHolidays(int year, HolidayState? holidayState)
    {
        // Adelaide Cup Day is a public holiday in South Australia
        if (holidayState is not {Value: HolidayStateValue.SA})
        {
            yield break;
        }

        // second Monday of March
        var holiday = NthWeekdayOnOrAfter(2, DayOfWeek.Monday, new DateOnly(year, 3, 1));
        yield return new Holiday(holidayState, holiday, "Adelaide Cup Day");
    }
}
