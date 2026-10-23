using Ets.Core.Domain.CQRS;
using Ets.Core.Domain.ValueObjects;
using Ets.Modules.Deals.Domain.ValueObjects;

namespace Ets.Modules.Deals.Application.Deals.CaptureAsxFuturesDeal;

/// <summary>
///     Captures an ASX futures deal from what the trader quotes: product code, direction, price ($/MWh) and
///     volume (lots, in MW). Returns the new deal's id.
/// </summary>
public sealed record CaptureAsxFuturesDealCommand(
    string ProductCode,
    TradeDirection Direction,
    Amount Price,
    Volume Volume) : ICommand<Guid>;
