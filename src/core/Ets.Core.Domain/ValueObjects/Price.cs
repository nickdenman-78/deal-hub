using Ets.Core.Domain.Models;

namespace Ets.Core.Domain.ValueObjects;

/// <summary>
///     An energy price in Australian dollars per megawatt-hour ($/MWh) — a contract price, strike, cap level
///     or settlement price. Rounding happens only at boundaries (display, invoicing), never here.
/// </summary>
public sealed record Price(decimal Value) : IValueObject
{
    public const string Unit = "$/MWh";

    public override string ToString()
    {
        return $"{Value:0.00####} {Unit}";
    }
}
