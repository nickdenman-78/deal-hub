using Ets.Core.Application.Models.Holidays;
using Ets.Core.Domain.Models;
using Ets.Core.Domain.ValueObjects;

namespace Ets.Core.Application.Calculators.Holidays;

internal class WesternAustraliaDayCalculator : HolidayCalculatorBase
{
    public override IEnumerable<Holiday> CalculateHolidays(int year, HolidayState? holidayState)
    {
        // WA only: Western Australia Day is on the first Monday of June
        if (holidayState?.Equals(HolidayState.WA) != true)
        {
            yield break;
        }

        var holiday = NthWeekdayOnOrAfter(1, DayOfWeek.Monday, new DateOnly(year, 6, 1));
        yield return new Holiday(holidayState, holiday, "Western Australia Day");
    }
}
