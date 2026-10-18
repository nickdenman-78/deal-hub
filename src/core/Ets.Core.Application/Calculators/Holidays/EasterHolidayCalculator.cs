using System.Diagnostics.CodeAnalysis;
using Ets.Core.Application.Models.Holidays;
using Ets.Core.Domain.Models;
using Ets.Core.Domain.ValueObjects;

namespace Ets.Core.Application.Calculators.Holidays;

[SuppressMessage("Major Code Smell", "S125:Sections of code should not be commented out")]
internal class EasterHolidayCalculator : HolidayCalculatorBase
{
    private static DateTime EasterSunday(int year)
    {
        int a = year % 19;
        int b = year / 100;
        int c = year % 100;
        int d = b / 4;
        int e = b % 4;
        int f = (b + 8) / 25;
        int g = (b - f + 1) / 3;
        int h = (19 * a + b - d - g + 15) % 30;
        int i = c / 4;
        int k = c % 4;
        int l = (32 + 2 * e + 2 * i - h - k) % 7;
        int m = (a + 11 * h + 22 * l) / 451;
        int month = (h + l - 7 * m + 114) / 31;
        int day = (h + l - 7 * m + 114) % 31 + 1;

        return new DateTime(year, month, day, 0, 0, 0, DateTimeKind.Unspecified);
    }

    public override IEnumerable<Holiday> CalculateHolidays(int year, HolidayState? holidayState)
    {
        var holiday = EasterSunday(year);

        // Good Friday and Easter Monday are country-wide
        yield return new Holiday(holidayState, DateOnly.FromDateTime(holiday.AddDays(-2)), "Good Friday");
        yield return new Holiday(holidayState, DateOnly.FromDateTime(holiday.AddDays(1)), "Easter Monday");

        // Easter Saturday is observed in ACT, NSW, VIC, QLD, and NT
        // Source: Holidays Act 1958 (ACT); Public Holidays Act 2010 (NSW) s.4; Public Holidays Act 1993 (Vic) s.6;
        //         Holidays Act 1983 (Qld) Sch 1; Public Holidays Act 1981 (NT)
        // Not observed in SA, WA (proposed 2028), or TAS
        if (holidayState?.Value is HolidayStateValue.ACT or HolidayStateValue.NSW or HolidayStateValue.VIC or HolidayStateValue.QLD or HolidayStateValue.NT)
        {
            yield return new Holiday(holidayState, DateOnly.FromDateTime(holiday.AddDays(-1)), "Easter Saturday");
        }

        // Easter Sunday is a statutory public holiday in NSW, ACT, VIC (always), QLD (from 2017), and SA (from 2024)
        // QLD source: Holidays and Other Legislation Amendment Act 2016 (Qld) — effective 2017
        // SA source:  Public Holidays Act 2023 (SA) — commenced 1 January 2024
        // NT observes Easter Sunday via annual proclamation under s.6 of the Public Holidays Act 1981 (NT) — not statutory
        // WA observes Easter Sunday via ministerial arrangement since 2022 — not statutory
        if (holidayState?.Value is HolidayStateValue.NSW or HolidayStateValue.ACT or HolidayStateValue.VIC
            || holidayState?.Value == HolidayStateValue.QLD && year >= 2017
            || holidayState?.Value == HolidayStateValue.SA && year >= 2024)
        {
            yield return new Holiday(holidayState, DateOnly.FromDateTime(holiday), "Easter Sunday");
        }
    }
}
