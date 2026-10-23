using Ets.Core.Application.Models.Holidays;
using Ets.Core.Domain.Models;
using Ets.Core.Domain.ValueObjects;

namespace Ets.Core.Application.Calculators.Holidays;

internal class NewYearsDayCalculator : HolidayCalculatorBase
{
    public override IEnumerable<Holiday> CalculateHolidays(int year, HolidayState? holidayState)
    {
        // New Year's Day is on the 1st of January
        var holiday = new DateOnly(year, 1, 1);
        yield return new Holiday(holidayState, holiday, "New Year's Day");

        // for all states New Year's Day is observed on the following Monday if it falls on a weekend
        if (IsWeekend(holiday))
        {
            yield return new Holiday(holidayState, MondayIfWeekend(holiday), "New Year's Day", true);
        }
    }
}
