using CronExpressionDescriptor;

namespace Ets.Core.Domain.ValueObjects;

/// <summary>
///     A recurring schedule: a Quartz cron expression (ADR-0015) evaluated in a time zone, optionally bounded by
///     a start and end date.
/// </summary>
/// <remarks>
///     <para>
///         Quartz expressions have six or seven fields, seconds first and an optional year last, and exactly one
///         of day-of-month and day-of-week is <c>?</c> — e.g. <c>0 0 6 ? * MON-FRI</c>. An expression that is
///         not Quartz-shaped gives <see cref="Empty" />.
///     </para>
///     <para>
///         The domain holds the schedule; it does not run Quartz (the architecture tests keep it out of Domain).
///         Occurrences come from <see cref="Services.ICronScheduleEvaluator" />, implemented with Quartz in
///         Infrastructure, which also rejects expressions that are well-shaped but not valid.
///     </para>
/// </remarks>
public sealed record CronSchedule
{
    private const int DayOfMonthField = 3;
    private const int DayOfWeekField = 5;
    private const string NoSpecificValue = "?";

    private CronSchedule(string expression, TimeZoneInfo timeZoneInfo, DateTimeOffset? startDate,
        DateTimeOffset? endDate)
    {
        TimeZone = timeZoneInfo;
        StartDate = startDate;
        EndDate = endDate;
        Expression = expression;
        Description = !string.IsNullOrWhiteSpace(Expression)
            ? ExpressionDescriptor.GetDescription(Expression,
                new Options
                {
                    ThrowExceptionOnParseError = false,
                    Use24HourTimeFormat = false,
                    Verbose = true
                })
            : "No schedule defined";
    }

    [UsedImplicitly] public DateTimeOffset? StartDate { get; init; }
    [UsedImplicitly] public DateTimeOffset? EndDate { get; init; }
    [UsedImplicitly] public TimeZoneInfo TimeZone { get; init; }

    [UsedImplicitly] public string Expression { get; init; }
    [UsedImplicitly] public string Description { get; init; }

    [UsedImplicitly] public bool IsEmpty => string.IsNullOrEmpty(Expression);

    [UsedImplicitly] public static CronSchedule Empty { get; } = new(string.Empty, TimeZoneInfo.Local, null, null);

    [UsedImplicitly]
    public static CronSchedule Create(string expression)
    {
        return Create(expression, null, null, null);
    }

    [UsedImplicitly]
    public static CronSchedule Create(string expression, string? timeZone)
    {
        return Create(expression, timeZone, null, null);
    }

    [UsedImplicitly]
    public static CronSchedule Create(string expression, string? timeZone, DateTimeOffset? endDate)
    {
        return Create(expression, timeZone, null, endDate);
    }

    [UsedImplicitly]
    public static CronSchedule Create(string expression, string? timeZone, DateTimeOffset? startDate,
        DateTimeOffset? endDate)
    {
        if (string.IsNullOrWhiteSpace(expression))
        {
            return Empty;
        }

        string[] fields = expression.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (!IsQuartzShaped(fields))
        {
            return Empty;
        }

        // if the time zone is not specified, use the local time zone
        var timeZoneInfo = string.IsNullOrWhiteSpace(timeZone)
            ? TimeZoneInfo.Local
            : TimeZoneInfo.FindSystemTimeZoneById(timeZone);

        return new CronSchedule(string.Join(' ', fields), timeZoneInfo, startDate, endDate);
    }

    /// <summary>Whether <paramref name="occurrence" /> falls inside the schedule's start and end dates.</summary>
    [UsedImplicitly]
    public bool IsWithinDates(DateTimeOffset occurrence)
    {
        return (!StartDate.HasValue || occurrence >= StartDate.Value) &&
               (!EndDate.HasValue || occurrence <= EndDate.Value);
    }

    private static bool IsQuartzShaped(string[] fields)
    {
        if (fields.Length is < 6 or > 7)
        {
            return false;
        }

        // Quartz requires exactly one of day-of-month and day-of-week to be '?'.
        bool dayOfMonthUnspecified = fields[DayOfMonthField] == NoSpecificValue;
        bool dayOfWeekUnspecified = fields[DayOfWeekField] == NoSpecificValue;
        return dayOfMonthUnspecified != dayOfWeekUnspecified;
    }
}
