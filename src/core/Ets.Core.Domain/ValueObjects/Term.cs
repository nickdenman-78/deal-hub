using System.Globalization;
using static Ets.Core.Domain.Specifications.TermConstants;

// ReSharper disable MemberCanBePrivate.Global

namespace Ets.Core.Domain.ValueObjects;

public sealed record Term : DateRange
{
    private Term(DateOnly startDate, DateOnly endDate) : base(startDate, endDate)
    {
    }

    [UsedImplicitly] public string Name { get; private init; } = string.Empty;

    [UsedImplicitly] public TermSpan Span { get; private init; } = TermSpan.NonStandard;

    public override string ToString()
    {
        return Name;
    }

    [UsedImplicitly]
    public IEnumerable<Term> AvailableTerms(TermPeriodValue periods = TermPeriodValue.All)
    {
        // Align dates to month start and end
        // quarters
        if ((periods & TermPeriodValue.Quarters) == TermPeriodValue.Quarters)
        {
            var qStart = NextQuarterStartDate(StartDate).AddMonths(-3);
            if (qStart < StartDate)
            {
                qStart = NextQuarterStartDate(StartDate);
            }

            while (qStart < EndDate)
            {
                var end = qStart.AddMonths(3).AddDays(-1);
                yield return Create(qStart, end);
                qStart = end.AddDays(1);
            }
        }

        // cal years
        if ((periods & TermPeriodValue.CalYears) == TermPeriodValue.CalYears)
        {
            var cStart = NextCalStartDate(StartDate).AddYears(-1);
            if (cStart < StartDate)
            {
                cStart = NextCalStartDate(StartDate);
            }

            while (cStart < EndDate)
            {
                var end = cStart.AddYears(1).AddDays(-1);
                if (end <= EndDate)
                {
                    yield return Create(cStart, end);
                }

                cStart = end.AddDays(1);
            }
        }

        // fin years
        if ((periods & TermPeriodValue.FinYears) == TermPeriodValue.FinYears)
        {
            var fStart = NextFinStartDate(StartDate).AddYears(-1);
            if (fStart < StartDate)
            {
                fStart = NextFinStartDate(StartDate);
            }

            while (fStart < EndDate)
            {
                var end = fStart.AddYears(1).AddDays(-1);
                if (end <= EndDate)
                {
                    yield return Create(fStart, end);
                }

                fStart = end.AddDays(1);
            }
        }

        // halfyears
        if ((periods & TermPeriodValue.HalfYears) == TermPeriodValue.HalfYears)
        {
            var hStart = NextCalStartDate(StartDate).AddMonths(-12);
            if (hStart < StartDate)
            {
                hStart = NextCalStartDate(StartDate);
            }

            while (hStart < EndDate)
            {
                var end = hStart.AddMonths(6).AddDays(-1);
                yield return Create(hStart, end);
                hStart = end.AddDays(1);
            }
        }

        if ((periods & TermPeriodValue.Months) != TermPeriodValue.Months)
        {
            yield break;
        }

        // months
        var mStart = StartDate;
        while (mStart < EndDate)
        {
            var end = mStart.AddMonths(1).AddDays(-1);
            yield return Create(mStart, end);
            mStart = end.AddDays(1);
        }
    }

    [UsedImplicitly]
    public IEnumerable<Term> StandardTerms(bool preferQtrToYearly = false)
    {
        // Align dates to month start and end
        var startDate = new DateOnly(StartDate.Year, StartDate.Month, 1);
        var endDate = new DateOnly(EndDate.Year, EndDate.Month, DateTime.DaysInMonth(EndDate.Year, EndDate.Month));

        while (startDate < endDate)
        {
            bool startAlignedToCal = startDate.Month == 1;
            bool startAlignedToFin = startDate.Month == 7;
            bool startAlignedToQtr = startDate.Month is 1 or 4 or 7 or 10;
            var nextQtrStartDate = NextQuarterStartDate(startDate);
            var nextCalStartDate = NextCalStartDate(startDate);
            var nextFinStartDate = NextFinStartDate(startDate);

            var dayBeforeNextCalStartDate = nextCalStartDate.AddDays(-1);
            var dayBeforeNextFinStartDate = nextFinStartDate.AddDays(-1);
            var dayBeforeNextQtrStartDate = nextQtrStartDate.AddDays(-1);

            // Check for full cal
            if (startAlignedToCal && dayBeforeNextCalStartDate <= endDate && !preferQtrToYearly)
            {
                yield return Create(startDate, dayBeforeNextCalStartDate);
                startDate = dayBeforeNextCalStartDate.AddDays(1);
            }
            // Check for full fin
            else if (startAlignedToFin && dayBeforeNextFinStartDate <= endDate && !preferQtrToYearly)
            {
                yield return Create(startDate, dayBeforeNextFinStartDate);
                startDate = dayBeforeNextFinStartDate.AddDays(1);
            }
            // Check for qtr preference
            else if (startAlignedToQtr && dayBeforeNextQtrStartDate <= endDate)
            {
                yield return Create(startDate, dayBeforeNextQtrStartDate);
                startDate = dayBeforeNextQtrStartDate.AddDays(1);
            }
            else
                // Add the month term
            {
                var end = new DateOnly(startDate.Year, startDate.Month,
                    DateTime.DaysInMonth(startDate.Year, startDate.Month));
                yield return Create(startDate, end);
                startDate = end.AddDays(1);
            }
        }
    }

    [UsedImplicitly]
    public static Term Create(string name)
    {
        if (!TryNormalizeTermName(name, out string? normalizedName) ||
            string.IsNullOrWhiteSpace(normalizedName))
        {
            throw new ArgumentException("Invalid term name", nameof(name));
        }

        // parse the name to determine the start and end dates
        if (!TryParseTermName(normalizedName, out var startDate, out var endDate))
        {
            throw new ArgumentException("Invalid term name", nameof(name));
        }

        return Create(startDate, endDate);
    }

    [UsedImplicitly]
    public static Term Create(int complianceYear)
    {
        int twoDigitYear = complianceYear switch
        {
            < 0 => throw new ArgumentOutOfRangeException(nameof(complianceYear)),
            < 100 => complianceYear,
            _ => complianceYear % 100
        };

        string name = $"Cal{twoDigitYear:00}";

        return Create(name);
    }

    [UsedImplicitly]
    public static new Term Create(DateTime startDate, DateTime endDate)
    {
        return Create(
            DateOnly.FromDateTime(startDate),
            DateOnly.FromDateTime(endDate));
    }

    [UsedImplicitly]
    public static new Term Create(DateOnly startDate, DateOnly endDate)
    {
        // align the start and end dates to the first and last days of the month
        var calcStartDate = new DateOnly(startDate.Year, startDate.Month, 1);
        var calcEndDate = new DateOnly(endDate.Year, endDate.Month, DateTime.DaysInMonth(endDate.Year, endDate.Month));

        bool isYear = calcStartDate.AddYears(1).AddDays(-1) == calcEndDate;
        bool sameYear = calcStartDate.Year == calcEndDate.Year;
        bool sameMonth = calcStartDate.Month == calcEndDate.Month && sameYear;

        return (startDate, endDate, isYear, sameYear, sameMonth) switch
        {
            {startDate: {Month: 1} sd, endDate: {Month: 12} ed, isYear: true} => new Term(sd, ed) {Name = $"Cal{sd:yy}", Span = TermSpan.CalYear},
            {startDate: {Month: 7} sd, endDate: {Month: 6} ed, isYear: true} => new Term(sd, ed) {Name = $"Fin{sd:yy}/{ed:yy}", Span = TermSpan.FinYear},
            {startDate: {Month: 1} sd, endDate: {Month: 3} ed, sameYear: true} => new Term(sd, ed) {Name = $"Q1{sd:yy}", Span = TermSpan.Quarter},
            {startDate: {Month: 4} sd, endDate: {Month: 6} ed, sameYear: true} => new Term(sd, ed) {Name = $"Q2{sd:yy}", Span = TermSpan.Quarter},
            {startDate: {Month: 7} sd, endDate: {Month: 9} ed, sameYear: true} => new Term(sd, ed) {Name = $"Q3{sd:yy}", Span = TermSpan.Quarter},
            {startDate: {Month: 10} sd, endDate: {Month: 12} ed, sameYear: true} => new Term(sd, ed) {Name = $"Q4{sd:yy}", Span = TermSpan.Quarter},
            {startDate: {Month: 1} sd, endDate: {Month: 6} ed, sameYear: true} => new Term(sd, ed) {Name = $"JJ{sd:yy}", Span = TermSpan.JanJun},
            {startDate: {Month: 7} sd, endDate: {Month: 12} ed, sameYear: true} => new Term(sd, ed) {Name = $"JD{sd:yy}", Span = TermSpan.JulDec},
            {startDate: var sd, endDate: var ed, sameMonth: true} => new Term(sd, ed)
            {
                Name = sd.ToString("MMMyy", CultureInfo.InvariantCulture),
                Span = TermSpan.Month
            },
            {startDate: var sd, endDate: var ed} => new Term(sd, ed)
            {
                Name = $"{sd.ToString("MMMyy", CultureInfo.InvariantCulture)}-{ed.ToString("MMMyy", CultureInfo.InvariantCulture)}",
                Span = TermSpan.NonStandard
            }
        };
    }

    [UsedImplicitly]
    public static bool IsValid(string? term)
    {
        if (string.IsNullOrWhiteSpace(term))
        {
            return false;
        }

        // if this is a number, it is a compliance year (year must be between 1970 and 2099)
        if (int.TryParse(term, out int complianceYear))
        {
            return complianceYear is >= 0 and <= 2099;
        }

        return TermRegexPattern().IsMatch(term);
    }

    [UsedImplicitly]
    public static IEnumerable<Term> OverlappingTerms(string? containedTerm)
    {
        if (string.IsNullOrEmpty(containedTerm))
        {
            yield break;
        }

        if (!TryParseTermName(containedTerm, out var startDate, out var endDate))
        {
            yield break;
        }

        if (IsAnnualTerm(containedTerm))
        {
            yield return Create(startDate, endDate);
            yield break;
        }

        // a quarter will fall in both a fin and cal year (arbitrary dates are not supported, yet)
        if (!IsQuarterlyTerm(containedTerm))
        {
            yield break;
        }

        yield return Create(startDate, endDate);
        yield return Create(FinStartDate(startDate), FinEndDate(endDate));
        yield return Create(CalStartDate(startDate), CalEndDate(endDate));
    }

    [UsedImplicitly]
    public static bool IsMonthTerm(string? standardTerm)
    {
        return IsMonthTerm(standardTerm, out _, out _);
    }

    [UsedImplicitly]
    public static bool IsMonthTerm(string? standardTerm, out int month, out int year)
    {
        // E.g. Jan23
        month = year = 0;

        if (string.IsNullOrWhiteSpace(standardTerm))
        {
            return false;
        }

        var match = MonthRegexPattern().Match(standardTerm);

        if (!match.Success ||
            !match.Groups["monthstart"].Success ||
            !match.Groups["monthstartyear"].Success)
        {
            return false;
        }

        var range = TermDateRange(standardTerm);

        month = range.StartDate.Month;
        year = range.StartDate.Year;

        return true;
    }

    [UsedImplicitly]
    public static bool IsQuarterlyTerm(string? standardTerm)
    {
        return IsQuarterlyTerm(standardTerm, out _, out _);
    }

    [UsedImplicitly]
    public static bool IsQuarterlyTerm(string? standardTerm, out int quarter, out int year)
    {
        // E.g. Q123
        quarter = year = 0;

        if (string.IsNullOrWhiteSpace(standardTerm))
        {
            return false;
        }

        var match = QuarterRegexPattern().Match(standardTerm);

        bool qtrMatch = match.Groups["qtr"].Success && int.TryParse(match.Groups["qtr"].Value, out quarter);
        bool yearMatch = match.Groups["qtryear"].Success && int.TryParse(match.Groups["qtryear"].Value, out year);

        if (yearMatch)
        {
            year += 2000;
        }

        return match.Success && qtrMatch && yearMatch;
    }

    [UsedImplicitly]
    public static bool IsAnnualTerm(string? standardTerm)
    {
        return IsCalTerm(standardTerm) || IsFinTerm(standardTerm);
    }

    [UsedImplicitly]
    public static bool IsCalTerm(string? standardTerm)
    {
        return IsCalTerm(standardTerm, out _);
    }

    [UsedImplicitly]
    public static bool IsCalTerm(string? standardTerm, out int year)
    {
        year = 0;

        if (string.IsNullOrWhiteSpace(standardTerm))
        {
            return false;
        }

        var match = CalYearRegexPattern().Match(standardTerm);

        return match.Success && match.Groups["calyear"].Success &&
               int.TryParse(match.Groups["calyear"].Value, out year);
    }

    [UsedImplicitly]
    public static bool IsFinTerm(string? standardTerm)
    {
        return IsFinTerm(standardTerm, out _, out _);
    }

    [UsedImplicitly]
    public static bool IsFinTerm(string? standardTerm, out int startYear, out int endYear)
    {
        // E.g., Fin23/24, Fin23-24, Fin2324 or Fin23 (meaning Fin22/23)
        startYear = endYear = 0;

        if (string.IsNullOrWhiteSpace(standardTerm))
        {
            return false;
        }

        var match = FinYearRegexPattern().Match(standardTerm);

        if (!match.Success)
        {
            return false;
        }

        if (match.Groups["finyearstart"].Success && match.Groups["finyearend"].Success)
        {
            return int.TryParse(match.Groups["finyearstart"].Value, out startYear) &&
                   int.TryParse(match.Groups["finyearend"].Value, out endYear) &&
                   endYear == startYear + 1;
        }

        if (!int.TryParse(match.Groups["finyearstart"].Value, out startYear))
        {
            return false;
        }

        endYear = startYear + 1;
        return true;
    }

    [UsedImplicitly]
    public static bool TryNormalizeTermName(string? standardTerm, out string? termName)
    {
        termName = null;

        if (string.IsNullOrWhiteSpace(standardTerm))
        {
            return false;
        }

        try
        {
            termName = NormalizeTermName(standardTerm);
            return true;
        }
        catch (ArgumentException)
        {
            return false;
        }
    }

    [UsedImplicitly]
    public static string NormalizeTermName(string? standardTerm, bool throwOnError = true)
    {
        if (int.TryParse(standardTerm, out int complianceYear))
        {
            standardTerm = CalYearTermFromComplianceYear(complianceYear);
        }

        if (string.IsNullOrWhiteSpace(standardTerm))
        {
            if (throwOnError)
            {
                throw new ArgumentNullException(nameof(standardTerm));
            }

            return string.Empty;
        }

        // decode the term name
        standardTerm = Uri.UnescapeDataString(standardTerm);

        var match = TermRegexPattern().Match(standardTerm);

        if (!match.Success)
        {
            if (throwOnError)
            {
                throw new ArgumentException($"{standardTerm} is not a standard term", nameof(standardTerm));
            }

            return string.Empty;
        }

        if (match.Groups["calyear"].Success && int.TryParse(match.Groups["calyear"].Value, out int calYear))
        {
            return $"Cal{calYear}";
        }

        if (match.Groups["finyearstart"].Success &&
            int.TryParse(match.Groups["finyearstart"].Value, out int finYearStart))
        {
            if (match.Groups["finyearend"].Success &&
                int.TryParse(match.Groups["finyearend"].Value, out int finYearEnd))
            {
                if (finYearEnd != finYearStart + 1)
                {
                    if (throwOnError)
                    {
                        throw new ArgumentException($"{standardTerm} is not a valid financial year term",
                            nameof(standardTerm));
                    }

                    return string.Empty;
                }

                return $"Fin{finYearStart}/{finYearEnd}";
            }

            return $"Fin{finYearStart - 1}/{finYearStart}";
        }

        if (match.Groups["qtr"].Success && match.Groups["qtryear"].Success &&
            int.TryParse(match.Groups["qtr"].Value, out int qtr) &&
            int.TryParse(match.Groups["qtryear"].Value, out int qtrYear))
        {
            return $"Q{qtr}{qtrYear}";
        }

        if (match.Groups["halfyearstart"].Success && match.Groups["halfyear"].Success &&
            int.TryParse(match.Groups["halfyear"].Value, out int halfYear))
        {
            return match.Groups["halfyearstart"].Value.Equals("JJ", StringComparison.OrdinalIgnoreCase)
                ? $"JJ{halfYear}"
                : $"JD{halfYear}";
        }

        if (match.Groups["monthstart"].Success && match.Groups["monthstartyear"].Success &&
            int.TryParse(match.Groups["monthstartyear"].Value, out int monthStartYear))
        {
            var start = DateTime.ParseExact($"{2000 + monthStartYear}-{match.Groups["monthstart"].Value}-01",
                "yyyy-MMM-dd", CultureInfo.InvariantCulture);

            string startMonthAbbreviation = CultureInfo.InvariantCulture.DateTimeFormat.AbbreviatedMonthNames[start.Month - 1];

            if (match.Groups["monthend"].Success && match.Groups["monthendyear"].Success &&
                int.TryParse(match.Groups["monthendyear"].Value, out int monthEndYear))
            {
                var end = DateTime
                    .ParseExact($"{2000 + monthEndYear}-{match.Groups["monthend"].Value}-01", "yyyy-MMM-dd", CultureInfo.InvariantCulture)
                    .AddMonths(1).AddDays(-1);

                string endMonthAbbreviation = CultureInfo.InvariantCulture.DateTimeFormat.AbbreviatedMonthNames[end.Month - 1];
                return $"{startMonthAbbreviation}{start:yy}-{endMonthAbbreviation}{end:yy}";
            }

            return $"{startMonthAbbreviation}{start:yy}";
        }

        if (throwOnError)
        {
            throw new ArgumentException($"Invalid term '{standardTerm}'", nameof(standardTerm));
        }

        return string.Empty;
    }

    [UsedImplicitly]
    public static string NormalizeTermName(int? complianceYear, bool throwOnError = true)
    {
        return NormalizeTermName(complianceYear?.ToString(CultureInfo.InvariantCulture), throwOnError);
    }

    private static bool TryParseTermName(string standardTerm, out DateOnly startDate, out DateOnly endDate)
    {
        startDate = default;
        endDate = default;

        if (string.IsNullOrWhiteSpace(standardTerm))
        {
            return false;
        }

        // if the standardTerm is a number between 1970 and 2099, it is a compliance year and can be converted to a cal year
        if (int.TryParse(standardTerm, out int complianceYear) && complianceYear is >= 1970 and <= 2069)
        {
            standardTerm = CalYearTermFromComplianceYear(complianceYear) ?? standardTerm;
        }

        var match = TermRegexPattern().Match(standardTerm);
        if (!match.Success)
        {
            throw new ArgumentException($"{standardTerm} is not a standard term", nameof(standardTerm));
        }

        if (match.Groups["calyear"].Success && int.TryParse(match.Groups["calyear"].Value, out int calYear))
        {
            startDate = calYear < 70 ? new DateOnly(2000 + calYear, 1, 1) : new DateOnly(1900 + calYear, 1, 1);
            endDate = calYear < 70 ? new DateOnly(2000 + calYear, 12, 31) : new DateOnly(1900 + calYear, 12, 31);
            return true;
        }

        if (match.Groups["finyearstart"].Success &&
            int.TryParse(match.Groups["finyearstart"].Value, out int finYearStart))
        {
            if (match.Groups["finyearend"].Success &&
                int.TryParse(match.Groups["finyearend"].Value, out int finYearEnd))
            {
                if (finYearEnd != finYearStart + 1)
                {
                    throw new ArgumentException($"{standardTerm} is not a valid financial year term",
                        nameof(standardTerm));
                }

                startDate = finYearStart < 70 ? new DateOnly(2000 + finYearStart, 7, 1) : new DateOnly(1900 + finYearStart, 7, 1);
                endDate = finYearStart < 70 ? new DateOnly(2000 + finYearEnd, 6, 30) : new DateOnly(1900 + finYearEnd, 6, 30);
                return true;
            }

            startDate = finYearStart < 71 ? new DateOnly(1999 + finYearStart, 7, 1) : new DateOnly(1899 + finYearStart, 7, 1);
            endDate = finYearStart < 71 ? new DateOnly(2000 + finYearStart, 6, 30) : new DateOnly(1900 + finYearStart, 6, 30);
            return true;
        }

        if (match.Groups["qtr"].Success && match.Groups["qtryear"].Success &&
            int.TryParse(match.Groups["qtr"].Value, out int qtr) &&
            int.TryParse(match.Groups["qtryear"].Value, out int qtrYear))
        {
            if (qtr is < 1 or > 4)
            {
                throw new ArgumentException($"{standardTerm} is not a valid quarterly term", nameof(standardTerm));
            }

            startDate = (qtrYear < 70 ? new DateOnly(2000 + qtrYear, 1, 1) : new DateOnly(1900 + qtrYear, 1, 1))
                .AddMonths((qtr - 1) * 3);
            endDate = startDate.AddMonths(3).AddDays(-1);
            return true;
        }

        if (match.Groups["halfyearstart"].Success && match.Groups["halfyear"].Success &&
            int.TryParse(match.Groups["halfyear"].Value, out int halfYear))
        {
            startDate = halfYear < 70 ? new DateOnly(2000 + halfYear, 1, 1) : new DateOnly(1900 + halfYear, 1, 1);
            endDate = startDate.AddMonths(6).AddDays(-1);

            if (match.Groups["halfyearstart"].Value.Equals("JJ", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            startDate = startDate.AddMonths(6);
            endDate = startDate.AddMonths(6).AddDays(-1);
            return true;
        }

        // ReSharper disable once InvertIf
        if (match.Groups["monthstart"].Success && match.Groups["monthstartyear"].Success &&
            int.TryParse(match.Groups["monthstartyear"].Value, out int monthStartYear))
        {
            startDate = DateOnly.ParseExact($"{(monthStartYear < 70 ? 2000 : 1900) + monthStartYear}-{match.Groups["monthstart"].Value}-01",
                "yyyy-MMM-dd", CultureInfo.InvariantCulture);
            endDate = startDate.AddMonths(1).AddDays(-1);

            if (match.Groups["monthend"].Success && match.Groups["monthendyear"].Success &&
                int.TryParse(match.Groups["monthendyear"].Value, out int monthEndYear))
            {
                endDate = DateOnly.ParseExact($"{(monthEndYear < 70 ? 2000 : 1900) + monthEndYear}-{match.Groups["monthend"].Value}-01",
                    "yyyy-MMM-dd", CultureInfo.InvariantCulture).AddMonths(1).AddDays(-1);
            }

            return true;
        }

        return false;
    }

    private static string? CalYearTermFromComplianceYear(int? complianceYear)
    {
        return complianceYear switch
        {
            < 0 => null,
            < 10 => $"Cal0{complianceYear}",
            < 100 => $"Cal{complianceYear}",
            >= 100 => $"Cal{complianceYear % 100:D2}",
            _ => null
        };
    }

    private static DateOnly NextQuarterStartDate(DateOnly date)
    {
        date = new DateOnly(date.Year, date.Month, 1).AddMonths(1);
        while (!QuarterStartMonths.Contains(date.Month))
        {
            date = date.AddMonths(1);
        }

        return date;
    }

    private static DateOnly NextCalStartDate(DateOnly date)
    {
        do
        {
            date = NextQuarterStartDate(date);
        } while (date.Month != 1);

        return date;
    }

    private static DateOnly NextFinStartDate(DateOnly date)
    {
        do
        {
            date = NextQuarterStartDate(date);
        } while (date.Month != 7);

        return date;
    }

    private static DateOnly CalStartDate(DateOnly date)
    {
        return new DateOnly(date.Year, 1, 1);
    }

    private static DateOnly CalEndDate(DateOnly date)
    {
        return new DateOnly(date.Year, 12, 31);
    }

    private static DateOnly FinStartDate(DateOnly date)
    {
        int finStartYear = date.Month >= 7 ? date.Year : date.Year - 1;
        return new DateOnly(finStartYear, 7, 1);
    }

    private static DateOnly FinEndDate(DateOnly date)
    {
        int finStartYear = date.Month >= 7 ? date.Year : date.Year - 1;
        return new DateOnly(finStartYear, 7, 1).AddYears(1).AddDays(-1);
    }

    private static DateRange TermDateRange(string standardTerm)
    {
        if (string.IsNullOrWhiteSpace(standardTerm))
        {
            throw new ArgumentNullException(nameof(standardTerm));
        }

        // if the standardTerm is a number between 1970 and 2099, it is a compliance year and can be converted to a cal year
        if (int.TryParse(standardTerm, out int complianceYear) && complianceYear is >= 1970 and <= 2099)
        {
            standardTerm = CalYearTermFromComplianceYear(complianceYear) ?? standardTerm;
        }

        var match = TermRegexPattern().Match(standardTerm);
        if (!match.Success)
        {
            throw new ArgumentException($"{standardTerm} is not a standard term", nameof(standardTerm));
        }

        if (match.Groups["calyear"].Success && int.TryParse(match.Groups["calyear"].Value, out int calYear))
        {
            return DateRange.Create(new DateOnly((calYear < 70 ? 2000 : 1900) + calYear, 1, 1), new DateOnly((calYear < 70 ? 2000 : 1900) + calYear, 12, 31));
        }

        if (match.Groups["finyearstart"].Success &&
            int.TryParse(match.Groups["finyearstart"].Value, out int finYearStart))
        {
            if (!match.Groups["finyearend"].Success ||
                !int.TryParse(match.Groups["finyearend"].Value, out int finYearEnd))
            {
                return DateRange.Create(new DateOnly((finYearStart < 70 ? 1999 : 1899) + finYearStart, 7, 1), new DateOnly((finYearStart < 70 ? 2000 : 1900) + finYearStart, 6, 30));
            }

            if (finYearEnd != finYearStart + 1)
            {
                throw new ArgumentException($"{standardTerm} is not a valid financial year term",
                    nameof(standardTerm));
            }

            return DateRange.Create(new DateOnly((finYearStart < 70 ? 2000 : 1900) + finYearStart, 7, 1), new DateOnly((finYearEnd < 70 ? 2000 : 1900) + finYearEnd, 6, 30));
        }

        if (match.Groups["qtr"].Success && match.Groups["qtryear"].Success &&
            int.TryParse(match.Groups["qtr"].Value, out int qtr) &&
            int.TryParse(match.Groups["qtryear"].Value, out int qtrYear))
        {
            if (qtr is < 1 or > 4)
            {
                throw new ArgumentException($"{standardTerm} is not a valid quarterly term", nameof(standardTerm));
            }

            var start = new DateOnly((qtrYear < 70 ? 2000 : 1900) + qtrYear, 1, 1).AddMonths((qtr - 1) * 3);
            var end = start.AddMonths(3).AddDays(-1);
            return DateRange.Create(start, end);
        }

        if (match.Groups["halfyearstart"].Success && match.Groups["halfyear"].Success &&
            int.TryParse(match.Groups["halfyear"].Value, out int halfYear))
        {
            var start = new DateOnly((halfYear < 70 ? 2000 : 1900) + halfYear, 1, 1);
            var end = start.AddMonths(6).AddDays(-1);

            if (match.Groups["halfyearstart"].Value.Equals("JJ", StringComparison.OrdinalIgnoreCase))
            {
                return DateRange.Create(start, end);
            }

            start = start.AddMonths(6);
            end = start.AddMonths(6).AddDays(-1);

            return DateRange.Create(start, end);
        }

        if (match.Groups["monthstart"].Success && match.Groups["monthstartyear"].Success &&
            int.TryParse(match.Groups["monthstartyear"].Value, out int monthStartYear))
        {
            var start = DateOnly.ParseExact($"{2000 + monthStartYear}-{match.Groups["monthstart"].Value}-01",
                "yyyy-MMM-dd", CultureInfo.InvariantCulture);
            var end = start.AddMonths(1).AddDays(-1);

            if (match.Groups["monthend"].Success && match.Groups["monthendyear"].Success &&
                int.TryParse(match.Groups["monthendyear"].Value, out int monthEndYear))
            {
                end = DateOnly
                    .ParseExact($"{(monthEndYear < 70 ? 2000 : 1900) + monthEndYear}-{match.Groups["monthend"].Value}-01", "yyyy-MMM-dd", CultureInfo.InvariantCulture)
                    .AddMonths(1).AddDays(-1);
            }

            return DateRange.Create(start, end);
        }

        throw new ArgumentException($"Invalid term '{standardTerm}'", nameof(standardTerm));
    }
}
