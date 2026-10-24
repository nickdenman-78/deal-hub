using Ets.Core.Domain.Models;

namespace Ets.Modules.Users.Domain.Repositories;

/// <summary>
///     Commits a Users use case in one transaction. Its own interface so a Users handler cannot be given another
///     module's unit of work.
/// </summary>
public interface IUsersUnitOfWork : IUnitOfWork;
