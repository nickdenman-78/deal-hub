using Ets.Core.Domain.Models;

namespace Ets.Modules.Deals.Domain.ValueObjects;

/// <summary>
///     A listed ASX product as it stood when a deal was captured: the decoded product code and its contract
///     size. Kept on the deal so later schedule changes do not alter captured deals.
/// </summary>
public sealed record AsxProduct(ProductCode ProductCode, ContractSize ContractSize) : IValueObject
{
    public override string ToString()
    {
        return ProductCode.ToString();
    }
}
