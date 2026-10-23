using Ets.Core.Application.Models.Holidays;
using Ets.Core.Domain.Models;
using Ets.Core.Domain.ValueObjects;

namespace Ets.Core.Application.Calculators.Holidays;

internal class LabourDayCalculator : HolidayCalculatorBase
{
    public override IEnumerable<Holiday> CalculateHolidays(int year, HolidayState? holidayState)
    {
        // for QLD, the first Monday in May is Labour Day, except 1st Monday in Oct for the years 2013 to 2015
        // for NSW, ACT and SA, the first Monday in October is Labour Day
        // for WA, the first Monday in March is Labour Day
        // for VIC and TAS the second Monday in March is Labour Day
        // for NT, the first Monday in May is Labour Day

        switch (holidayState?.Value)
        {
            case HolidayStateValue.QLD:
                if (year is >= 2013 and <= 2015)
                {
                    var qld2013To2015 = NthWeekdayOnOrAfter(1, DayOfWeek.Monday, new DateOnly(year, 10, 1));
                    yield return new Holiday(holidayState, qld2013To2015, "Labour Day");
                }
                else
                {
                    var qldHoliday = NthWeekdayOnOrAfter(1, DayOfWeek.Monday, new DateOnly(year, 5, 1));
                    yield return new Holiday(holidayState, qldHoliday, "Labour Day");
                }

                break;
            case HolidayStateValue.VIC:
                var vicHoliday = NthWeekdayOnOrAfter(2, DayOfWeek.Monday, new DateOnly(year, 3, 1));
                yield return new Holiday(holidayState, vicHoliday, "Labour Day");
                break;
            case HolidayStateValue.TAS:
                var tasHoliday = NthWeekdayOnOrAfter(2, DayOfWeek.Monday, new DateOnly(year, 3, 1));
                yield return new Holiday(holidayState, tasHoliday, "Eight Hours Day");
                break;
            case HolidayStateValue.NSW:
            case HolidayStateValue.ACT:
            case HolidayStateValue.SA:
                var saHoliday = NthWeekdayOnOrAfter(1, DayOfWeek.Monday, new DateOnly(year, 10, 1));
                yield return new Holiday(holidayState, saHoliday, "Labour Day");
                break;
            case HolidayStateValue.WA:
                var waHoliday = NthWeekdayOnOrAfter(1, DayOfWeek.Monday, new DateOnly(year, 3, 1));
                yield return new Holiday(holidayState, waHoliday, "Labour Day");
                break;
            case HolidayStateValue.NT:
                var ntHoliday = NthWeekdayOnOrAfter(1, DayOfWeek.Monday, new DateOnly(year, 5, 1));
                yield return new Holiday(holidayState, ntHoliday, "May Day");
                break;
        }
    }
}
