using Ets.Modules.Deals.Domain.Models;

namespace Ets.Modules.Deals.Domain.Repositories;

/// <summary>
///     Loads and stores <see cref="ExchangeDeal" /> aggregates. Implemented in Infrastructure over the module's
///     Marten store (ADR-0013): the stream id is the deal id and the stream holds the deal's events.
/// </summary>
public interface IExchangeDealRepository
{
    /// <summary>
    ///     Starts the stream of a newly captured deal with its uncommitted events. Nothing is written until the
    ///     unit of work saves.
    /// </summary>
    void Add(ExchangeDeal deal);
}
