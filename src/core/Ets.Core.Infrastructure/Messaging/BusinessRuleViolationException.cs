using Ets.Core.Domain.Models;

namespace Ets.Core.Infrastructure.Messaging;

/// <summary>
///     Thrown by a Wolverine consumer when the command it invoked failed on a business rule.
/// </summary>
/// <remarks>
///     A business failure is final, so the host's error policy moves the message to the error queue without
///     retrying (<c>opts.OnException&lt;BusinessRuleViolationException&gt;().MoveToErrorQueue()</c>). Any
///     other exception is treated as transient and retried. This is the only place a <see cref="Result" />
///     failure becomes an exception: Wolverine needs one to route the message.
/// </remarks>
public sealed class BusinessRuleViolationException : Exception
{
    public BusinessRuleViolationException(DomainError error)
        : base(error?.Description)
    {
        ArgumentNullException.ThrowIfNull(error);
        Error = error;
    }

    public BusinessRuleViolationException()
    {
        Error = DomainError.None;
    }

    public BusinessRuleViolationException(string message) : base(message)
    {
        Error = DomainError.None;
    }

    public BusinessRuleViolationException(string message, Exception innerException) : base(message, innerException)
    {
        Error = DomainError.None;
    }

    public DomainError Error { get; }
}
