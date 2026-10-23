using Ets.Core.Domain.Models;

namespace Ets.Modules.Deals.Infrastructure.Persistence.Entities;

/// <summary>
///     A listed ASX electricity futures product and its contract size, as published in ASX's contract size
///     schedule. The row behind <c>IAsxProductCatalogue</c>; the domain sees it as an <c>AsxProduct</c>.
/// </summary>
internal sealed class DbAsxProduct : IAudited
{
    /// <summary>The ASX 24 product code, e.g. <c>BNH26</c>.</summary>
    public string ProductCode { get; set; } = string.Empty;

    /// <summary>The number of days the contract covers.</summary>
    public int NumberOfDays { get; set; }

    /// <summary>MWh one lot delivers over the contract's term.</summary>
    public decimal ContractSize { get; set; }

    public DateTimeOffset? DateCreated { get; set; }

    public string? CreatedBy { get; set; }

    public DateTimeOffset? DateModified { get; set; }

    public string? ModifiedBy { get; set; }
}
