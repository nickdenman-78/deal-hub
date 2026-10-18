using Ets.Core.Application.Models.Holidays;
using Ets.Core.Domain.Models;
using Ets.Core.Domain.ValueObjects;

namespace Ets.Core.Application.Calculators.Holidays;

internal class AustraliaDayCalculator : HolidayCalculatorBase
{
    public override IEnumerable<Holiday> CalculateHolidays(int year, HolidayState? holidayState)
    {
        // Australia Day is on the 26th of January
        var holiday = new DateOnly(year, 1, 26);
        yield return new Holiday(holidayState, holiday, "Australia Day");

        // for all states Australia Day is observed on the following Monday if it falls on a weekend
        if (IsWeekend(holiday))
        {
            yield return new Holiday(holidayState, MondayIfWeekend(holiday), "Australia Day", true);
        }
    }
}
