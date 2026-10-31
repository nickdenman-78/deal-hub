using Ets.Core.Domain.Models;

namespace Ets.Modules.Deals.Application.Deals;

/// <summary>Failures the deal use cases report that are not an aggregate's rule.</summary>
internal static class DealErrors
{
    public const string NotFoundErrorCode = "deal.not-found";

    public static DomainError NotFound(Guid dealId)
    {
        return DomainError.NotFound(NotFoundErrorCode, $"There is no deal {dealId}.");
    }
}
