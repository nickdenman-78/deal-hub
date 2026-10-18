using Ets.Core.Application.Models.Holidays;
using Ets.Core.Domain.Models;
using Ets.Core.Domain.ValueObjects;

namespace Ets.Core.Application.Calculators.Holidays;

internal class AnzacDayCalculator : HolidayCalculatorBase
{
    public override IEnumerable<Holiday> CalculateHolidays(int year, HolidayState? holidayState)
    {
        // ANZAC Day is a public holiday in all states and territories
        var holiday = new DateOnly(year, 4, 25);
        yield return new Holiday(holidayState, holiday, "ANZAC Day");

        // for certain states, ANZAC Day is observed on the following Monday if it falls on a weekend
        // NSW/ACT/WA: Monday substitute if Saturday or Sunday
        // NT: Monday substitute if Sunday only (Public Holidays Act 1981 (NT))
        // QLD/SA: no substitute from 2022 onwards; historically certain years ≤ 2021 were gazetted with a substitute
        // VIC/TAS: no substitute
        switch (holidayState?.Value)
        {
            case HolidayStateValue.NSW:
            case HolidayStateValue.ACT:
            case HolidayStateValue.WA:
                if (IsWeekend(holiday))
                {
                    yield return new Holiday(holidayState, MondayIfWeekend(holiday), "ANZAC Day", true);
                }

                break;
            case HolidayStateValue.NT:
                if (IsDayOfWeek(holiday, DayOfWeek.Sunday))
                {
                    yield return new Holiday(holidayState, MondayIfWeekend(holiday), "ANZAC Day", true);
                }

                break;
            case HolidayStateValue.QLD:
            case HolidayStateValue.SA:
                if (year <= 2021 && IsWeekend(holiday))
                {
                    yield return new Holiday(holidayState, MondayIfWeekend(holiday), "ANZAC Day", true);
                }

                break;
        }
    }
}
