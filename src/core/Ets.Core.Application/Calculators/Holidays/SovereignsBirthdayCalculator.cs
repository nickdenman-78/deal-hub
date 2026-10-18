using Ets.Core.Application.Models.Holidays;
using Ets.Core.Domain.Models;
using Ets.Core.Domain.ValueObjects;

namespace Ets.Core.Application.Calculators.Holidays;

internal class SovereignsBirthdayCalculator : HolidayCalculatorBase
{
    public override IEnumerable<Holiday> CalculateHolidays(int year, HolidayState? holidayState)
    {
        // For QLD: The King's/Queen's Birthday is observed on the first Monday in October from 2016
        // and second Monday in June for years prior to 2016
        // For WA:  The King's/Queen's Birthday is observed on the last Monday in September
        // For NSW: The King's/Queen's Birthday is observed on the second Monday in June
        // For SA:  The King's/Queen's Birthday is observed on the second Monday in June
        // For TAS: The King's/Queen's Birthday is observed on the second Monday in June
        // For VIC: The King's/Queen's Birthday is observed on the second Monday in June
        // For ACT: The King's/Queen's Birthday is observed on the second Monday in June
        // For NT:  The King's/Queen's Birthday is observed on the second Monday in June
        string name = year >= 2023 ? "King's Birthday" : "Queen's Birthday";

        switch (holidayState?.Value)
        {
            case HolidayStateValue.QLD:
                if (year is >= 2016 or 2012)
                {
                    var qld2016Onwards = NthWeekdayOnOrAfter(1, DayOfWeek.Monday, new DateOnly(year, 10, 1));
                    yield return new Holiday(holidayState, qld2016Onwards, name);
                }
                else
                {
                    var qldHoliday = NthWeekdayOnOrAfter(2, DayOfWeek.Monday, new DateOnly(year, 6, 1));
                    yield return new Holiday(holidayState, qldHoliday, name);
                }

                break;
            case HolidayStateValue.WA:
                // last monday in September, unless it's the 30th, then it's the second-last monday in September
                var waHoliday = LastWeekdayBefore(DayOfWeek.Monday, new DateOnly(year, 9, 30));
                yield return new Holiday(holidayState, waHoliday, name);
                break;
            case HolidayStateValue.NSW:
            case HolidayStateValue.SA:
            case HolidayStateValue.TAS:
            case HolidayStateValue.VIC:
            case HolidayStateValue.ACT:
            case HolidayStateValue.NT:
                var holiday = NthWeekdayOnOrAfter(2, DayOfWeek.Monday, new DateOnly(year, 6, 1));
                yield return new Holiday(holidayState, holiday, name);
                break;
        }
    }
}
