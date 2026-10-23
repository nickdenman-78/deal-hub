namespace Ets.Core.Domain.Events;

/// <summary>
///     Something that happened to an aggregate. Past-tense records in a module's Domain
///     (<c>DealCaptured</c>, <c>DealConfirmed</c>).
/// </summary>
/// <remarks>
///     <para>
///         Domain events stay inside their module. The unit of work maps the relevant ones explicitly to
///         versioned integration events and publishes those. In event-sourced modules these are also the
///         persisted stream events, so a released event type is never changed: a new shape is a new type
///         plus an upcaster.
///     </para>
///     <para>
///         <see cref="OccurredAt" /> comes from <c>IDateTimeProvider</c>, passed in by the behaviour that
///         raises the event — never <c>DateTime.Now</c>.
///     </para>
/// </remarks>
public interface IDomainEvent
{
    DateTimeOffset OccurredAt { get; }
}
