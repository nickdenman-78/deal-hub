namespace Ets.Core.Domain.Models;

public enum DomainErrorType
{
    [UsedImplicitly] Failure = 0,
    [UsedImplicitly] Validation = 1,
    [UsedImplicitly] Problem = 2,
    [UsedImplicitly] NotFound = 3,
    [UsedImplicitly] Conflict = 4
}
