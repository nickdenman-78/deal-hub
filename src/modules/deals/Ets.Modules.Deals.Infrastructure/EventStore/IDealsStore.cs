using Marten;

namespace Ets.Modules.Deals.Infrastructure.EventStore;

/// <summary>
///     The Deals module's ancillary Marten store (ADR-0013): the event streams of its event-sourced aggregates,
///     in the <c>deals_events</c> schema.
/// </summary>
/// <remarks>Public because Marten generates the implementation at runtime from outside this assembly.</remarks>
public interface IDealsStore : IDocumentStore;
