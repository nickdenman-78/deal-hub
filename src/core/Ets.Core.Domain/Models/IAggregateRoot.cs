using Ets.Core.Domain.Events;

namespace Ets.Core.Domain.Models;

/// <summary>
///     Marks the root entity of an aggregate: the consistency boundary and the only entity a repository
///     loads or persists directly. Corresponds to a CML <c>Aggregate</c> root.
/// </summary>
/// <remarks>
///     A module's unit of work reads <see cref="DomainEvents" /> after the aggregate changes, maps the
///     relevant ones to integration events for the Wolverine outbox, and then calls
///     <see cref="ClearDomainEvents" />.
/// </remarks>
public interface IAggregateRoot : IEntity
{
    /// <summary>The events raised since the aggregate was loaded or last saved.</summary>
    IReadOnlyCollection<IDomainEvent> DomainEvents { get; }

    /// <summary>Forgets the raised events once they have been persisted and published.</summary>
    void ClearDomainEvents();
}
