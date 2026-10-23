using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;
using Ets.Core.Domain.Comparers;
using Ets.Core.Domain.ValueObjects;
using JsonSerializer = System.Text.Json.JsonSerializer;

namespace EtsCoreTests;

public class TermTests(ITestOutputHelper output)
{
    private static readonly JsonSerializerOptions JsonSettings = new()
    {
        WriteIndented = true,
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        Converters = {new JsonStringEnumConverter()}
    };

    [Theory]
    [InlineData("Fin12/13", "Fin12/13")]
    [InlineData("Fin12%2F13", "Fin12/13")]
    [InlineData("fin12-13", "Fin12/13")]
    [InlineData("Fin1213", "Fin12/13")]
    [InlineData("Fin13", "Fin12/13")]
    [InlineData("cal12", "Cal12")]
    [InlineData("Q113", "Q113")]
    [InlineData("Q213", "Q213")]
    [InlineData("Q313", "Q313")]
    [InlineData("q413", "Q413")]
    [InlineData("Jul13", "Jul13")]
    [InlineData("Jun13", "Jun13")]
    [InlineData("Jan14", "Jan14")]
    [InlineData("dec14", "Dec14")]
    [InlineData("jJ13", "JJ13")]
    [InlineData("Jd13", "JD13")]
    [InlineData("Nov14-oct15", "Nov14-Oct15")]
    [InlineData("Sep25", "Sep25")]
    [InlineData("Sept25", "Sep25")]
    public void Verify_NormalizedStandardTerms(string term, string expected)
    {
        string actual = Term.NormalizeTermName(term);
        output.WriteLine($"{term} => {actual}");
        Assert.Equal(expected, actual);
    }

    [Theory]
    [InlineData("Fin12/13", "2012-07-01", "2013-06-30")]
    [InlineData("Fin12%2F13", "2012-07-01", "2013-06-30")]
    [InlineData("Fin12-13", "2012-07-01", "2013-06-30")]
    [InlineData("Fin1213", "2012-07-01", "2013-06-30")]
    [InlineData("Fin13", "2012-07-01", "2013-06-30")]
    [InlineData("Cal12", "2012-01-01", "2012-12-31")]
    [InlineData("Q113", "2013-01-01", "2013-03-31")]
    [InlineData("Q213", "2013-04-01", "2013-06-30")]
    [InlineData("Q313", "2013-07-01", "2013-09-30")]
    [InlineData("Q413", "2013-10-01", "2013-12-31")]
    [InlineData("Jul13", "2013-07-01", "2013-07-31")]
    [InlineData("Jun13", "2013-06-01", "2013-06-30")]
    [InlineData("Jan14", "2014-01-01", "2014-01-31")]
    [InlineData("Dec14", "2014-12-01", "2014-12-31")]
    [InlineData("JJ13", "2013-01-01", "2013-06-30")]
    [InlineData("JD13", "2013-07-01", "2013-12-31")]
    [InlineData("Nov14-Oct15", "2014-11-01", "2015-10-31")]
    [InlineData("Fin69", "2068-07-01", "2069-06-30")]
    [InlineData("Fin68/69", "2068-07-01", "2069-06-30")]
    [InlineData("Fin69/70", "2069-07-01", "2070-06-30")]
    [InlineData("Fin70", "2069-07-01", "2070-06-30")]
    [InlineData("Sep25", "2025-09-01", "2025-09-30")]
    [InlineData("Sept25", "2025-09-01", "2025-09-30")]
    public void Verify_GetTermStartAndEndDates(string term, string start, string end)
    {
        var startDate = DateOnly.ParseExact(start, "yyyy-MM-dd", CultureInfo.InvariantCulture);
        var endDate = DateOnly.ParseExact(end, "yyyy-MM-dd", CultureInfo.InvariantCulture);
        var actual = Term.Create(term);

        string json = JsonSerializer.Serialize(actual, JsonSettings);
        output.WriteLine(json);

        output.WriteLine($"{term} => ({startDate:d} vs {actual.StartDate:d}) to ({endDate:d} vs {actual.EndDate:d})");

        Assert.Equal(startDate, actual.StartDate);
        Assert.Equal(endDate, actual.EndDate);
    }

    [Theory]
    [InlineData("Jan22")]
    [InlineData("Oct22")]
    [InlineData("Dec22")]
    [InlineData("Apr24")]
    [InlineData("Sep24")]
    [InlineData("Sept24")]
    public void Verify_IsMonthTerm(string term)
    {
        output.WriteLine($"{term}");
        bool result = Term.IsMonthTerm(term);
        Assert.True(result);
    }

    [Theory]
    [InlineData("Q122")]
    [InlineData("Q222")]
    [InlineData("Q322")]
    [InlineData("Q422")]
    public void Verify_IsQuarterlyTerm(string term)
    {
        output.WriteLine($"{term}");
        bool result = Term.IsQuarterlyTerm(term);
        Assert.True(result);
    }

    [Theory]
    [InlineData("Cal22")]
    [InlineData("Q22")]
    [InlineData("Q3222")]
    [InlineData("Q522")]
    public void Verify_IsQuarterlyTerm_Fails(string term)
    {
        output.WriteLine($"{term}");
        bool result = Term.IsQuarterlyTerm(term);
        Assert.False(result);
    }

    [Theory]
    [InlineData("Cal22")]
    [InlineData("Fin22/23")]
    [InlineData("Fin22-23")]
    [InlineData("Fin2223")]
    [InlineData("Fin23")]
    public void Verify_IsAnnualTerm(string term)
    {
        output.WriteLine($"{term}");
        bool result = Term.IsAnnualTerm(term);
        Assert.True(result);
    }

    [Theory]
    [InlineData("Cal2")]
    [InlineData("Fin23/25")]
    [InlineData("Fin23-25")]
    [InlineData("Fin2325")]
    public void Verify_IsAnnualTerm_Fails(string term)
    {
        output.WriteLine($"{term}");
        bool result = Term.IsAnnualTerm(term);
        Assert.False(result);
    }


    [Theory]
    [InlineData("Cal22")]
    [InlineData("Cal23")]
    public void Verify_IsCalTerm(string term)
    {
        output.WriteLine($"{term}");
        bool result = Term.IsCalTerm(term);
        Assert.True(result);
    }

    [Theory]
    [InlineData("Cal2")]
    [InlineData("Cal123")]
    public void Verify_IsCalTerm_Fails(string term)
    {
        output.WriteLine($"{term}");
        bool result = Term.IsCalTerm(term);
        Assert.False(result);
    }


    [Theory]
    [InlineData("Fin22/23")]
    [InlineData("Fin22-23")]
    [InlineData("Fin2223")]
    [InlineData("Fin23")]
    public void Verify_IsFinTerm(string term)
    {
        output.WriteLine($"{term}");
        bool result = Term.IsFinTerm(term);
        Assert.True(result);
    }

    [Theory]
    [InlineData("Fin23/25")]
    [InlineData("Fin23-25")]
    [InlineData("Fin2325")]
    public void Verify_IsFinTerm_Fails(string term)
    {
        output.WriteLine($"{term}");
        bool result = Term.IsFinTerm(term);
        Assert.False(result);
    }

    [Theory]
    [InlineData("2015-01-01", "2015-12-31", 365)]
    [InlineData("2020-01-01", "2020-12-31", 366)]
    [InlineData("2014-12-10", "2014-12-20", 11)]
    public void Verify_DaysInTerm(string start, string end, int expected)
    {
        var startDate = DateOnly.ParseExact(start, "yyyy-MM-dd", CultureInfo.InvariantCulture);
        var endDate = DateOnly.ParseExact(end, "yyyy-MM-dd", CultureInfo.InvariantCulture);
        int actual = Term.Create(startDate, endDate).NumberOfDays;

        output.WriteLine($"Days in term: {startDate:d} to {endDate:d}: Expected: {expected} vs Actual {actual}");

        Assert.Equal(expected, actual);
    }

    [Theory]
    [InlineData("2015-01-01", "2015-12-31", 12)]
    [InlineData("2015-01-01", "2015-03-31", 3)]
    public void Verify_MonthsInTerm(string start, string end, int expected)
    {
        var startDate = DateOnly.ParseExact(start, "yyyy-MM-dd", CultureInfo.InvariantCulture);
        var endDate = DateOnly.ParseExact(end, "yyyy-MM-dd", CultureInfo.InvariantCulture);
        int actual = Term.Create(startDate, endDate).NumberOfMonths;

        output.WriteLine($"Months in term: {startDate:d} to {endDate:d}: Expected: {expected} vs Actual {actual}");

        Assert.Equal(expected, actual);
    }

    [Theory]
    [InlineData("2014-01-01", "2014-12-31", "Cal14")]
    [InlineData("2014-01-15", "2014-12-15", "Cal14")]
    [InlineData("2014-07-01", "2015-06-30", "Fin14/15")]
    [InlineData("2014-07-15", "2015-06-10", "Fin14/15")]
    [InlineData("2014-01-01", "2014-03-31", "Q114")]
    [InlineData("2020-01-01", "2020-03-31", "Q120")]
    [InlineData("2069-01-01", "2069-03-31", "Q169")]
    [InlineData("1970-01-01", "1970-03-31", "Q170")]
    [InlineData("2014-04-01", "2014-06-30", "Q214")]
    [InlineData("2014-07-01", "2014-09-30", "Q314")]
    [InlineData("2014-10-01", "2014-12-31", "Q414")]
    [InlineData("2014-01-01", "2014-06-30", "JJ14")]
    [InlineData("2014-07-01", "2014-12-31", "JD14")]
    [InlineData("2014-02-01", "2015-04-30", "Feb14-Apr15")]
    public void Verify_TermName(string start, string end, string expected)
    {
        var startDate = DateOnly.ParseExact(start, "yyyy-MM-dd", CultureInfo.InvariantCulture);
        var endDate = DateOnly.ParseExact(end, "yyyy-MM-dd", CultureInfo.InvariantCulture);
        var actual = Term.Create(startDate, endDate);

        output.WriteLine($"Term: {startDate:d} to {endDate:d}: Expected: {expected} vs Actual {actual.Name}");

        Assert.Equal(expected, actual.Name);
    }

    [Fact]
    public void Verify_GetTerms_Returns_Quarterly_Terms_For_Cal_Year()
    {
        var term = Term.Create(new DateOnly(2015, 1, 1), new DateOnly(2015, 12, 31));
        var terms = term.AvailableTerms(TermPeriodValue.Quarters).ToList();

        Assert.Equal(4, terms.Count);
        Assert.Equal("Q115", terms[0].Name);
        Assert.Equal(new DateOnly(2015, 1, 1), terms[0].StartDate);
        Assert.Equal(new DateOnly(2015, 3, 31), terms[0].EndDate);
        Assert.Equal("Q215", terms[1].Name);
        Assert.Equal(new DateOnly(2015, 4, 1), terms[1].StartDate);
        Assert.Equal(new DateOnly(2015, 6, 30), terms[1].EndDate);
        Assert.Equal("Q315", terms[2].Name);
        Assert.Equal(new DateOnly(2015, 7, 1), terms[2].StartDate);
        Assert.Equal(new DateOnly(2015, 9, 30), terms[2].EndDate);
        Assert.Equal("Q415", terms[3].Name);
        Assert.Equal(new DateOnly(2015, 10, 1), terms[3].StartDate);
        Assert.Equal(new DateOnly(2015, 12, 31), terms[3].EndDate);
    }

    [Fact]
    public void Verify_GetTerms_Returns_Quarterly_Terms_For_Multiple_Cal_Year()
    {
        var term = Term.Create(new DateOnly(2015, 1, 1), new DateOnly(2016, 12, 31));
        var terms = term.AvailableTerms(TermPeriodValue.Quarters).ToList();

        Assert.Equal(8, terms.Count);
        Assert.Equal("Q115", terms[0].Name);
        Assert.Equal(new DateOnly(2015, 1, 1), terms[0].StartDate);
        Assert.Equal(new DateOnly(2015, 3, 31), terms[0].EndDate);
        Assert.Equal("Q215", terms[1].Name);
        Assert.Equal(new DateOnly(2015, 4, 1), terms[1].StartDate);
        Assert.Equal(new DateOnly(2015, 6, 30), terms[1].EndDate);
        Assert.Equal("Q315", terms[2].Name);
        Assert.Equal(new DateOnly(2015, 7, 1), terms[2].StartDate);
        Assert.Equal(new DateOnly(2015, 9, 30), terms[2].EndDate);
        Assert.Equal("Q415", terms[3].Name);
        Assert.Equal(new DateOnly(2015, 10, 1), terms[3].StartDate);
        Assert.Equal(new DateOnly(2015, 12, 31), terms[3].EndDate);
        Assert.Equal("Q116", terms[4].Name);
        Assert.Equal(new DateOnly(2016, 1, 1), terms[4].StartDate);
        Assert.Equal(new DateOnly(2016, 3, 31), terms[4].EndDate);
        Assert.Equal("Q216", terms[5].Name);
        Assert.Equal(new DateOnly(2016, 4, 1), terms[5].StartDate);
        Assert.Equal(new DateOnly(2016, 6, 30), terms[5].EndDate);
        Assert.Equal("Q316", terms[6].Name);
        Assert.Equal(new DateOnly(2016, 7, 1), terms[6].StartDate);
        Assert.Equal(new DateOnly(2016, 9, 30), terms[6].EndDate);
        Assert.Equal("Q416", terms[7].Name);
        Assert.Equal(new DateOnly(2016, 10, 1), terms[7].StartDate);
        Assert.Equal(new DateOnly(2016, 12, 31), terms[7].EndDate);
    }

    [Fact]
    public void Verify_GetTerms_Returns_Quarterly_Terms_For_3_Quarter_Year()
    {
        var term = Term.Create(new DateOnly(2015, 1, 1), new DateOnly(2015, 9, 30));
        var terms = term.AvailableTerms(TermPeriodValue.Quarters).ToList();

        Assert.Equal(3, terms.Count);
        Assert.Equal("Q115", terms[0].Name);
        Assert.Equal(new DateOnly(2015, 1, 1), terms[0].StartDate);
        Assert.Equal(new DateOnly(2015, 3, 31), terms[0].EndDate);
        Assert.Equal("Q215", terms[1].Name);
        Assert.Equal(new DateOnly(2015, 4, 1), terms[1].StartDate);
        Assert.Equal(new DateOnly(2015, 6, 30), terms[1].EndDate);
        Assert.Equal("Q315", terms[2].Name);
        Assert.Equal(new DateOnly(2015, 7, 1), terms[2].StartDate);
        Assert.Equal(new DateOnly(2015, 9, 30), terms[2].EndDate);
    }

    [Fact]
    public void Verify_GetTerms_Returns_Monthly_And_Quarterly_Terms_For_Non_Standard_Nov_Start()
    {
        var term = Term.Create(new DateOnly(2014, 11, 1), new DateOnly(2016, 2, 28));
        var terms = term.StandardTerms(true).ToList();

        Assert.Equal(8, terms.Count);
        Assert.Equal("Nov14", terms[0].Name);
        Assert.Equal(new DateOnly(2014, 11, 1), terms[0].StartDate);
        Assert.Equal(new DateOnly(2014, 11, 30), terms[0].EndDate);
        Assert.Equal("Dec14", terms[1].Name);
        Assert.Equal(new DateOnly(2014, 12, 1), terms[1].StartDate);
        Assert.Equal(new DateOnly(2014, 12, 31), terms[1].EndDate);
        Assert.Equal("Q115", terms[2].Name);
        Assert.Equal(new DateOnly(2015, 1, 1), terms[2].StartDate);
        Assert.Equal(new DateOnly(2015, 3, 31), terms[2].EndDate);
        Assert.Equal("Q215", terms[3].Name);
        Assert.Equal(new DateOnly(2015, 4, 1), terms[3].StartDate);
        Assert.Equal(new DateOnly(2015, 6, 30), terms[3].EndDate);
        Assert.Equal("Q315", terms[4].Name);
        Assert.Equal(new DateOnly(2015, 7, 1), terms[4].StartDate);
        Assert.Equal(new DateOnly(2015, 9, 30), terms[4].EndDate);
        Assert.Equal("Q415", terms[5].Name);
        Assert.Equal(new DateOnly(2015, 10, 1), terms[5].StartDate);
        Assert.Equal(new DateOnly(2015, 12, 31), terms[5].EndDate);
        Assert.Equal("Jan16", terms[6].Name);
        Assert.Equal(new DateOnly(2016, 1, 1), terms[6].StartDate);
        Assert.Equal(new DateOnly(2016, 1, 31), terms[6].EndDate);
        Assert.Equal("Feb16", terms[7].Name);
        Assert.Equal(new DateOnly(2016, 2, 1), terms[7].StartDate);
        Assert.Equal(new DateOnly(2016, 2, 29), terms[7].EndDate);
    }

    // test term sort comparer
    [Fact]
    public void Verify_TermSortComparer()
    {
        // sort the following random terms into the right order
        string[] testData = new[]
        {
            "Fin22/23",
            "Oct22",
            "Dec98",
            "Q122",
            "JJ22",
            "Q322",
            "Fin23/24",
            "Q222",
            "Dec23",
            "Mar22",
            "JJ23",
            "Q422",
            "JD22",
            "Cal22",
            "Q123",
            "Jul23",
            "Cal98",
            "Oct22",
            "JD23",
            "Jul98",
            "Jan98",
            "Q223",
            "Q498",
            "Dec22",
            "Q170",
            "Q169",
            "Q323",
            "Q298",
            "Q423",
            "Cal23",
            "Jan22",
            "Jan23",
            "Jul22",
            "Fin98/99",
            "Q198",
            "JD98",
            "JJ98",
            "Q398"
        };

        // years are considered between 1970 and 2069
        string[] expected = new[]
        {
            "Jan98",
            "Jul98",
            "Dec98",
            "Jan22",
            "Mar22",
            "Jul22",
            "Oct22",
            "Oct22",
            "Dec22",
            "Jan23",
            "Jul23",
            "Dec23",

            "Q170",
            "Q198",
            "Q298",
            "Q398",
            "Q498",
            "Q122",
            "Q222",
            "Q322",
            "Q422",
            "Q123",
            "Q223",
            "Q323",
            "Q423",
            "Q169",

            "JJ98",
            "JJ22",
            "JJ23",
            "JD98",
            "JD22",
            "JD23",

            "Cal98",
            "Cal22",
            "Cal23",

            "Fin98/99",
            "Fin22/23",
            "Fin23/24"
        };

        string[] result = testData.OrderBy(x => x, new TermComparer()).ToArray();
        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData("Q122", "Q122", true)]
    [InlineData("Q122", "Q123", false)]
    public void Verify_TermsEqual_ByName(string term1, string term2, bool expected)
    {
        var first = Term.Create(term1);
        var second = Term.Create(term2);
        bool result = first.Equals(second);
        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData("2025-01-01", "2025-01-31", "2025-01-01", "2025-01-31", true)]
    [InlineData("2025-01-01", "2025-01-31", "2025-01-01", "2025-01-30", false)]
    [InlineData("2025-01-01", "2025-03-31", "2025-01-01", "2025-03-31", true)]
    public void Verify_TermsEqual_ByDate(string term1Start, string term1End, string term2Start, string term2End, bool expected)
    {
        var first = Term.Create(DateOnly.ParseExact(term1Start, "yyyy-MM-dd", CultureInfo.InvariantCulture), DateOnly.ParseExact(term1End, "yyyy-MM-dd", CultureInfo.InvariantCulture));
        var second = Term.Create(DateOnly.ParseExact(term2Start, "yyyy-MM-dd", CultureInfo.InvariantCulture), DateOnly.ParseExact(term2End, "yyyy-MM-dd", CultureInfo.InvariantCulture));
        bool result = first == second;
        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData("2025-01-01", "2025-03-31", "Q125", true)]
    [InlineData("2025-01-01", "2025-01-31", "Jan25", true)]
    [InlineData("2025-01-01", "2025-01-30", "Jan25", false)]
    [InlineData("2025-01-15", "2025-01-25", "Jan25", false)]
    [InlineData("2025-01-01", "2025-02-28", "Jan25", false)]
    [InlineData("2025-01-01", "2025-06-30", "JJ25", true)]
    [InlineData("2025-01-01", "2025-12-31", "Cal25", true)]
    public void Verify_TermsEqual_ByVariant(string term1Start, string term1End, string term2, bool expected)
    {
        var first = Term.Create(DateOnly.ParseExact(term1Start, "yyyy-MM-dd", CultureInfo.InvariantCulture), DateOnly.ParseExact(term1End, "yyyy-MM-dd", CultureInfo.InvariantCulture));
        var second = Term.Create(term2);

        string jsonFirst = JsonSerializer.Serialize(first, JsonSettings);
        string jsonSecond = JsonSerializer.Serialize(second, JsonSettings);

        output.WriteLine(jsonFirst);
        output.WriteLine(jsonSecond);

        bool result = first == second;
        Assert.Equal(expected, result);
    }
}
