using Ets.Core.Domain.Events;

namespace Ets.Core.Domain.Models;

/// <summary>
///     Base for state-based aggregate roots (EF Core modules: Risk, Users, market and reference data).
/// </summary>
/// <typeparam name="TId">The typed id.</typeparam>
/// <remarks>
///     Behaviour changes state directly and calls <see cref="Raise" /> to record what happened. Event-sourced
///     aggregates (Deals, Settlement) derive from <see cref="EventSourcedAggregate{TId}" /> instead.
/// </remarks>
public abstract class AggregateRoot<TId> : Entity<TId>, IAggregateRoot
    where TId : struct
{
    private readonly List<IDomainEvent> _domainEvents = [];

    protected AggregateRoot(TId id) : base(id)
    {
    }

    protected AggregateRoot()
    {
    }

    public IReadOnlyCollection<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();

    public void ClearDomainEvents()
    {
        _domainEvents.Clear();
    }

    protected void Raise(IDomainEvent domainEvent)
    {
        ArgumentNullException.ThrowIfNull(domainEvent);
        _domainEvents.Add(domainEvent);
    }
}
