using Ets.Core.Domain.CQRS;

namespace Ets.Modules.Deals.Application.Deals.LookUpAsxProduct;

/// <summary>
///     Decodes an ASX product code and looks it up in the ASX product catalogue, so a trader sees what a code
///     trades before capturing a deal in it.
/// </summary>
/// <param name="ProductCode">The code as typed, such as <c>bnh27</c>.</param>
public sealed record LookUpAsxProductQuery(string ProductCode) : IQuery<AsxProductResponse>;
