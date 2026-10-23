using Ets.Core.Application.Models.Holidays;
using Ets.Core.Domain.Models;
using Ets.Core.Domain.ValueObjects;

namespace Ets.Core.Application.Calculators.Holidays;

internal class ChristmasDayCalculator : HolidayCalculatorBase
{
    public override IEnumerable<Holiday> CalculateHolidays(int year, HolidayState? holidayState)
    {
        // country-wide holiday
        // Christmas Day is on 25th of December, and observed on the following Monday if it falls on a weekend
        var holiday = new DateOnly(year, 12, 25);

        yield return new Holiday(holidayState, holiday, "Christmas Day");

        switch (holidayState?.Value)
        {
            case HolidayStateValue.ACT:
                if (IsDayOfWeek(holiday, DayOfWeek.Saturday))
                {
                    yield return new Holiday(holidayState, MondayIfWeekend(holiday), "Christmas Day", true);
                }

                if (IsDayOfWeek(holiday, DayOfWeek.Sunday))
                {
                    yield return new Holiday(holidayState, NthWeekdayOnOrAfter(1, DayOfWeek.Tuesday, holiday), "Christmas Day", true);
                }

                yield break;

            default:
                if (IsWeekend(holiday))
                {
                    yield return new Holiday(holidayState, MondayIfWeekend(holiday), "Christmas Day", true);
                }

                yield break;
        }
    }
}
