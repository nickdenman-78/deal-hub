using Ets.Core.Domain.Models;

namespace Ets.Modules.Deals.Domain.Repositories;

/// <summary>
///     Commits a Deals use case: the appended events and the integration events mapped from them, in one
///     transaction. Its own interface so a Deals handler cannot be given another module's unit of work.
/// </summary>
public interface IDealsUnitOfWork : IUnitOfWork;
