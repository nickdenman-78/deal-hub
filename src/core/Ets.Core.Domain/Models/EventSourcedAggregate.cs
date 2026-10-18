using System.Collections.Concurrent;
using System.Reflection;
using Ets.Core.Domain.Events;

namespace Ets.Core.Domain.Models;

/// <summary>
///     Base for event-sourced aggregate roots (Deals, Settlement — ADR-0013).
/// </summary>
/// <typeparam name="TId">The typed id; also the Marten stream id.</typeparam>
/// <remarks>
///     <para>
///         State changes <em>only</em> by applying events. Behaviour validates, returns a
///         <see cref="Result" />, and calls <see cref="Raise" />, which applies the event and records it as
///         uncommitted — so in-memory state is always what the stream would rebuild.
///     </para>
///     <para>
///         A subtype declares one <c>Apply(TEvent)</c> method per event it handles, at any visibility and at
///         any level of the hierarchy. An event with no <c>Apply</c> method is a programming error and
///         throws: silently ignoring it would let the stream and the in-memory state drift apart.
///     </para>
/// </remarks>
public abstract class EventSourcedAggregate<TId> : Entity<TId>, IAggregateRoot
    where TId : struct
{
    private const string ApplyMethodName = "Apply";

    private static readonly ConcurrentDictionary<(Type Aggregate, Type Event), MethodInfo> ApplyMethods = new();

    private readonly List<IDomainEvent> _uncommittedEvents = [];

    /// <summary>
    ///     The stream version this instance was loaded at: the number of events already persisted. The
    ///     repository appends uncommitted events expecting this version (optimistic concurrency).
    /// </summary>
    [UsedImplicitly]
    public long Version { get; private set; }

    /// <summary>The events raised since the aggregate was loaded, in order.</summary>
    public IReadOnlyList<IDomainEvent> UncommittedEvents => _uncommittedEvents.AsReadOnly();

    /// <summary>
    ///     The same events as <see cref="UncommittedEvents" />, through the <see cref="IAggregateRoot" />
    ///     contract the unit of work reads.
    /// </summary>
    public IReadOnlyCollection<IDomainEvent> DomainEvents => UncommittedEvents;

    /// <summary>
    ///     Marks the uncommitted events as persisted: the version moves past them and the list empties.
    /// </summary>
    public void ClearDomainEvents()
    {
        Version += _uncommittedEvents.Count;
        _uncommittedEvents.Clear();
    }

    /// <summary>
    ///     Rebuilds state from a stream. Used by the repository and by tests (given events → when → then).
    /// </summary>
    /// <param name="history">The persisted events, oldest first.</param>
    public void LoadFromHistory(IEnumerable<IDomainEvent> history)
    {
        ArgumentNullException.ThrowIfNull(history);

        foreach (var domainEvent in history)
        {
            Dispatch(domainEvent);
            Version++;
        }
    }

    /// <summary>Applies <paramref name="domainEvent" /> and records it for the repository to append.</summary>
    protected void Raise(IDomainEvent domainEvent)
    {
        ArgumentNullException.ThrowIfNull(domainEvent);

        Dispatch(domainEvent);
        _uncommittedEvents.Add(domainEvent);
    }

    [System.Diagnostics.CodeAnalysis.SuppressMessage(
        "Major Vulnerability",
        "S3011:Reflection should not be used to increase accessibility of classes, methods, or fields",
        Justification = "Apply methods are private or protected on purpose so only the aggregate can change its own state; this base class is the one caller.")]
    private static MethodInfo FindApplyMethod(Type aggregateType, Type eventType)
    {
        const BindingFlags flags = BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic |
                                   BindingFlags.DeclaredOnly;

        // Walk the hierarchy explicitly: private Apply methods on a base type are not returned by
        // GetMethods on the derived type.
        for (var type = aggregateType; type is not null && type != typeof(object); type = type.BaseType)
        {
            var method = type
                .GetMethods(flags)
                .FirstOrDefault(m => m.Name == ApplyMethodName &&
                                     m.GetParameters() is [{ } parameter] &&
                                     parameter.ParameterType == eventType);

            if (method is not null)
            {
                return method;
            }
        }

        throw new InvalidOperationException(
            $"{aggregateType.Name} has no {ApplyMethodName}({eventType.Name}) method.");
    }

    private void Dispatch(IDomainEvent domainEvent)
    {
        var method = ApplyMethods.GetOrAdd(
            (GetType(), domainEvent.GetType()),
            static key => FindApplyMethod(key.Aggregate, key.Event));

        try
        {
            method.Invoke(this, [domainEvent]);
        }
        catch (TargetInvocationException exception) when (exception.InnerException is not null)
        {
            System.Runtime.ExceptionServices.ExceptionDispatchInfo.Capture(exception.InnerException).Throw();
            throw;
        }
    }
}
