using System.Text.Json;
using Ets.Core.Domain.Services;
using Ets.Core.Domain.ValueObjects;
using Ets.Core.Infrastructure.Scheduling;

namespace EtsCoreTests;

public class CronScheduleTests(ITestOutputHelper output)
{
    private static readonly JsonSerializerOptions CompactJson = new() {WriteIndented = false};

    private readonly QuartzCronScheduleEvaluator _evaluator = new();

    private static IEnumerable<string?> NullOrWhiteSpace()
    {
        yield return null;
        yield return string.Empty;
        yield return "   ";
        yield return "\t";
        yield return "\n";
    }

    private static string ToJson(CronSchedule s)
    {
        var payload = new
        {
            s.Expression,
            s.IsEmpty,
            TimeZone = s.TimeZone.Id,
            s.StartDate,
            s.EndDate,
            s.Description
        };

        return JsonSerializer.Serialize(payload, CompactJson);
    }

    [Fact]
    public void Create_ReturnsEmpty_WhenExpressionIsNullOrWhitespace()
    {
        foreach (string? expr in NullOrWhiteSpace())
        {
            var schedule = CronSchedule.Create(expr ?? string.Empty);
            output.WriteLine($"Expression: '{expr ?? "<null>"}' => not null");
            output.WriteLine($"JSON: {ToJson(schedule)}");
            Assert.NotNull(schedule);
            Assert.True(schedule.IsEmpty);
        }
    }

    [Fact]
    public void Create_UsesUtcTimeZone_WhenProvided()
    {
        var schedule = CronSchedule.Create("0 0 12 * * ?", "UTC");
        Assert.NotNull(schedule);
        output.WriteLine($"TimeZone: {schedule.TimeZone.Id}");
        output.WriteLine($"JSON: {ToJson(schedule)}");
        Assert.Equal("UTC", schedule.TimeZone.Id);
    }

    [Fact]
    public void GetOccurrences_StandardMinutes_RespectsReferenceTime()
    {
        // Every minute
        var schedule = CronSchedule.Create("0 * * * * ?", "UTC");
        var fixedNow = new DateTimeOffset(2025, 01, 01, 10, 25, 42, TimeSpan.Zero);
        var time = new FakeDateTimeProvider(fixedNow);

        output.WriteLine($"JSON: {ToJson(schedule)}");
        var occurrences = _evaluator.GetOccurrences(schedule, time.UtcNow, 3).ToArray();

        foreach ((var dt, int index) in occurrences.Select((d, i) => (d, i)))
        {
            output.WriteLine($"[{index}] {dt:o}");
        }

        Assert.Equal(3, occurrences.Length);
        // Should be aligned to the next minute boundary: 10:26:00Z, 10:27:00Z, 10:28:00Z
        Assert.Equal(new DateTimeOffset(2025, 01, 01, 10, 26, 0, TimeSpan.Zero), occurrences[0]);
        Assert.Equal(new DateTimeOffset(2025, 01, 01, 10, 27, 0, TimeSpan.Zero), occurrences[1]);
        Assert.Equal(new DateTimeOffset(2025, 01, 01, 10, 28, 0, TimeSpan.Zero), occurrences[2]);
    }

    [Fact]
    public void GetOccurrences_EveryTenSeconds_UsesTheSecondsField()
    {
        // Every 10 seconds
        var schedule = CronSchedule.Create("*/10 * * * * ?", "UTC");
        var fixedNow = new DateTimeOffset(2025, 02, 15, 08, 00, 05, TimeSpan.Zero);
        var time = new FakeDateTimeProvider(fixedNow);

        output.WriteLine($"JSON: {ToJson(schedule)}");
        var occurrences = _evaluator.GetOccurrences(schedule, time.UtcNow, 4).ToArray();

        foreach ((var dt, int index) in occurrences.Select((d, i) => (d, i)))
        {
            output.WriteLine($"[{index}] {dt:o}");
        }

        Assert.Equal(4, occurrences.Length);
        // The next multiples of 10 seconds after :05 are :10, :20, :30, :40
        Assert.Equal(new DateTimeOffset(2025, 02, 15, 08, 00, 10, TimeSpan.Zero), occurrences[0]);
        Assert.Equal(new DateTimeOffset(2025, 02, 15, 08, 00, 20, TimeSpan.Zero), occurrences[1]);
        Assert.Equal(new DateTimeOffset(2025, 02, 15, 08, 00, 30, TimeSpan.Zero), occurrences[2]);
        Assert.Equal(new DateTimeOffset(2025, 02, 15, 08, 00, 40, TimeSpan.Zero), occurrences[3]);
    }

    [Fact]
    public void GetOccurrences_Respects_StartDate()
    {
        // Minutely schedule, but we set StartDate after the reference time
        var startDate = new DateTimeOffset(2025, 03, 10, 14, 15, 00, TimeSpan.Zero);
        var schedule = CronSchedule.Create("0 * * * * ?", "UTC", startDate, null);

        var reference = new DateTimeOffset(2025, 03, 10, 14, 10, 30, TimeSpan.Zero);
        var time = new FakeDateTimeProvider(reference);

        output.WriteLine($"JSON: {ToJson(schedule)}");
        var first = _evaluator.GetOccurrences(schedule, time.UtcNow, 1).FirstOrDefault();
        output.WriteLine($"Ref: {reference:o} Start: {startDate:o} First: {first:o}");

        // Since GetNextOccurrence is exclusive, with a minutely cron the first will be 14:16:00
        Assert.Equal(new DateTimeOffset(2025, 03, 10, 14, 16, 00, TimeSpan.Zero), first);
    }

    [Fact]
    public void GetOccurrences_Respects_EndDate()
    {
        // Hourly at minute 0
        var endDate = new DateTimeOffset(2025, 04, 01, 10, 00, 00, TimeSpan.Zero);
        var schedule = CronSchedule.Create("0 0 * * * ?", "UTC", null, endDate);

        var reference = new DateTimeOffset(2025, 04, 01, 09, 30, 00, TimeSpan.Zero);
        var time = new FakeDateTimeProvider(reference);

        output.WriteLine($"JSON: {ToJson(schedule)}");
        var occurrences = _evaluator.GetOccurrences(schedule, time.UtcNow, 3).ToArray();
        foreach ((var dt, int index) in occurrences.Select((d, i) => (d, i)))
        {
            output.WriteLine($"[{index}] {dt:o}");
        }

        // Only 09:00 already passed; next are 10:00, 11:00, ... but EndDate is 10:00, so we should only get 10:00
        Assert.Single(occurrences);
        Assert.Equal(new DateTimeOffset(2025, 04, 01, 10, 00, 00, TimeSpan.Zero), occurrences[0]);
    }

    [Fact]
    public void GetOccurrences_Empty_When_EndDateBeforeNextOccurrence()
    {
        var endDate = new DateTimeOffset(2025, 05, 20, 12, 00, 00, TimeSpan.Zero);
        var schedule = CronSchedule.Create("0 0 13 * * ?", "UTC", null, endDate); // 13:00 daily

        var reference = new DateTimeOffset(2025, 05, 20, 12, 30, 00, TimeSpan.Zero);
        var time = new FakeDateTimeProvider(reference);

        output.WriteLine($"JSON: {ToJson(schedule)}");
        var occurrences = _evaluator.GetOccurrences(schedule, time.UtcNow, 2).ToArray();
        output.WriteLine($"Count: {occurrences.Length}");
        Assert.Empty(occurrences);
    }

    [Fact]
    public void Create_ReturnsEmpty_ForExpressionsThatAreNotQuartzShaped()
    {
        string[] invalidExpressions =
        [
            "invalid",
            "a b c d e",
            "0 12 * * *", // five-field (Unix) cron: Quartz has a seconds field
            "* * *", // too few fields
            "0 0 12 * * ? 2026 x", // too many fields
            "0 0 12 * * *", // neither day field is '?'
            "0 0 12 ? * ?" // both day fields are '?'
        ];

        foreach (string expr in invalidExpressions)
        {
            var schedule = CronSchedule.Create(expr);
            output.WriteLine($"Expr: '{expr}' -> JSON: {ToJson(schedule)}");
            Assert.True(schedule.IsEmpty);
            Assert.Equal(string.Empty, schedule.Expression);
        }
    }

    [Theory]
    [InlineData("0 0 6 ? * MON-FRI", true)]
    [InlineData("0 0 12 L * ?", true)]
    [InlineData("0 15 10 ? * 6#3 2027", true)]
    [InlineData("61 0 12 * * ?", false)] // second out of range
    [InlineData("0 0 25 * * ?", false)] // hour out of range
    [InlineData("0 0 12 ? * FUNDAY", false)]
    public void IsValid_UsesQuartzToCheckWellShapedExpressions(string expression, bool expected)
    {
        var schedule = CronSchedule.Create(expression, "UTC");

        Assert.False(schedule.IsEmpty);
        Assert.Equal(expected, _evaluator.IsValid(schedule));
    }

    [Fact]
    public void GetOccurrences_ReturnsEmpty_ForAnExpressionQuartzRejects()
    {
        var schedule = CronSchedule.Create("0 0 25 * * ?", "UTC");

        Assert.Empty(_evaluator.GetOccurrences(schedule, DateTimeOffset.UtcNow));
    }

    [Fact]
    public void GetOccurrences_FollowsTheScheduleTimeZone()
    {
        // 06:00 in Brisbane (UTC+10, no daylight saving) is 20:00 UTC the day before.
        var schedule = CronSchedule.Create("0 0 6 ? * *", "Australia/Brisbane");
        var reference = new DateTimeOffset(2026, 10, 18, 0, 0, 0, TimeSpan.Zero);

        var first = _evaluator.GetOccurrences(schedule, reference, 1).Single();

        Assert.Equal(new DateTimeOffset(2026, 10, 18, 20, 0, 0, TimeSpan.Zero), first.ToUniversalTime());
    }

    [Fact]
    public void Empty_Schedule_Has_Expected_Shape()
    {
        var empty = CronSchedule.Empty;
        output.WriteLine($"JSON: {ToJson(empty)}");
        Assert.True(empty.IsEmpty);
        Assert.Equal(string.Empty, empty.Expression);
        Assert.Equal(TimeZoneInfo.Local.Id, empty.TimeZone.Id);
        Assert.Null(empty.StartDate);
        Assert.Null(empty.EndDate);
        Assert.Empty(_evaluator.GetOccurrences(empty, DateTimeOffset.UtcNow, 3));
    }

    [Fact]
    public void GetOccurrences_ReturnsEmpty_ForEmptySchedule()
    {
        var empty = CronSchedule.Empty;
        output.WriteLine($"JSON: {ToJson(empty)}");
        var occurrences = _evaluator.GetOccurrences(empty, DateTimeOffset.UtcNow).ToArray();
        Assert.Empty(occurrences);
    }

    private sealed class FakeDateTimeProvider(DateTimeOffset now) : IDateTimeProvider
    {
        public DateTimeOffset Now { get; } = now;
        public DateTimeOffset UtcNow => Now.ToUniversalTime();
    }
}
