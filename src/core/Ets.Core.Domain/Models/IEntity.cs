namespace Ets.Core.Domain.Models;

/// <summary>
///     A domain object with a distinct identity. Corresponds to a CML <c>Entity</c>.
/// </summary>
/// <remarks>
///     The non-generic marker exists so architecture tests and conventions can find every entity without
///     knowing its id type.
/// </remarks>
public interface IEntity : IDomainObject;

/// <summary>
///     An entity identified by a strongly typed id record wrapping a Guid v7 (<c>DealId(Guid Value)</c>).
/// </summary>
/// <typeparam name="TId">The typed id.</typeparam>
public interface IEntity<out TId> : IEntity
    where TId : struct
{
    TId Id { get; }
}
