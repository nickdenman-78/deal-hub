using Ets.Core.Application.Models.Holidays;
using Ets.Core.Domain.Models;
using Ets.Core.Domain.ValueObjects;

namespace Ets.Core.Application.Calculators.Holidays;

internal class CanberraDayCalculator : HolidayCalculatorBase
{
    public override IEnumerable<Holiday> CalculateHolidays(int year, HolidayState? holidayState)
    {
        // Canberra Day is only a public holiday in the ACT
        if (holidayState?.Equals(HolidayState.ACT) != true)
        {
            yield break;
        }

        // Canberra Day is on the second Monday in March
        var holiday = NthWeekdayOnOrAfter(2, DayOfWeek.Monday, new DateOnly(year, 3, 1));
        yield return new Holiday(holidayState, holiday, "Canberra Day");
    }
}
