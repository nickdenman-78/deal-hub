using Ets.Core.Domain.ValueObjects;

namespace Ets.Core.Domain.Services;

/// <summary>
///     Works out when a <see cref="CronSchedule" /> fires. Implemented with Quartz in Infrastructure
///     (ADR-0015), so Domain and Application never reference the scheduler.
/// </summary>
public interface ICronScheduleEvaluator
{
    /// <summary>Whether Quartz accepts the schedule's expression.</summary>
    bool IsValid(CronSchedule schedule);

    /// <summary>
    ///     The next <paramref name="numberOfOccurrences" /> times the schedule fires after
    ///     <paramref name="from" /> (exclusive), no earlier than its start date and no later than its end date.
    ///     Empty for an empty or invalid schedule.
    /// </summary>
    /// <param name="schedule">The schedule to evaluate.</param>
    /// <param name="from">The instant to look forward from, usually <c>IDateTimeProvider.UtcNow</c>.</param>
    /// <param name="numberOfOccurrences">How many occurrences to return at most.</param>
    IEnumerable<DateTimeOffset> GetOccurrences(CronSchedule schedule, DateTimeOffset from, int numberOfOccurrences = 5);
}
