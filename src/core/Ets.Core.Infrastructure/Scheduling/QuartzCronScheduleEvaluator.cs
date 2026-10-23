using Ets.Core.Domain.Services;
using Ets.Core.Domain.ValueObjects;
using Quartz;

namespace Ets.Core.Infrastructure.Scheduling;

/// <summary>Evaluates <see cref="CronSchedule" />s with Quartz's own cron parser (ADR-0015).</summary>
internal sealed class QuartzCronScheduleEvaluator : ICronScheduleEvaluator
{
    public bool IsValid(CronSchedule schedule)
    {
        ArgumentNullException.ThrowIfNull(schedule);

        return !schedule.IsEmpty && CronExpression.TryParse(schedule.Expression, out _);
    }

    public IEnumerable<DateTimeOffset> GetOccurrences(
        CronSchedule schedule,
        DateTimeOffset from,
        int numberOfOccurrences = 5)
    {
        ArgumentNullException.ThrowIfNull(schedule);
        ArgumentOutOfRangeException.ThrowIfNegative(numberOfOccurrences);

        if (schedule.IsEmpty || !CronExpression.TryParse(schedule.Expression, out var expression))
        {
            return [];
        }

        return Occurrences(schedule, expression.WithTimeZone(schedule.TimeZone), from, numberOfOccurrences);
    }

    private static IEnumerable<DateTimeOffset> Occurrences(
        CronSchedule schedule,
        CronExpression expression,
        DateTimeOffset from,
        int numberOfOccurrences)
    {
        if (schedule.StartDate.HasValue && schedule.StartDate.Value > from)
        {
            from = schedule.StartDate.Value;
        }

        var next = expression.GetNextValidTimeAfter(from);

        while (next.HasValue && numberOfOccurrences-- > 0)
        {
            if (!schedule.IsWithinDates(next.Value))
            {
                yield break;
            }

            yield return next.Value;
            next = expression.GetNextValidTimeAfter(next.Value);
        }
    }
}
