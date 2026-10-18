using Ets.Core.Application.Models.Holidays;
using Ets.Core.Domain.Models;
using Ets.Core.Domain.ValueObjects;

namespace Ets.Core.Application.Calculators.Holidays;

internal class ReconciliationDayCalculator : HolidayCalculatorBase
{
    public override IEnumerable<Holiday> CalculateHolidays(int year, HolidayState? holidayState)
    {
        // ACT only: Reconciliation Day is on the first Monday on or after 27th of May
        if (holidayState?.Equals(HolidayState.ACT) != true)
        {
            yield break;
        }

        var holiday = NthWeekdayOnOrAfter(1, DayOfWeek.Monday, new DateOnly(year, 5, 27));
        yield return new Holiday(holidayState, holiday, "Reconciliation Day");
    }
}
