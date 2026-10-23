using System.Diagnostics.CodeAnalysis;
using Ets.Core.Domain.ValueObjects;

namespace Ets.Modules.Deals.Domain.ValueObjects;

/// <summary>Whether the portfolio bought or sold the contracts.</summary>
public abstract record TradeDirection : Enumeration<TradeDirectionValue, TradeDirection>
{
    [UsedImplicitly] public static readonly TradeDirection None = new Unspecified();
    [UsedImplicitly] public static readonly TradeDirection Buy = new BuyDirection();
    [UsedImplicitly] public static readonly TradeDirection Sell = new SellDirection();

    private TradeDirection(TradeDirectionValue value, string name, string description) : base(value, name)
    {
        Description = description;
    }

    [UsedImplicitly] public string Description { get; }

    [UsedImplicitly]
    public static bool TryParse(string? value, [NotNullWhen(true)] out TradeDirection? direction)
    {
        direction = Enumerations.FirstOrDefault(x =>
            x.Value.Value != TradeDirectionValue.None &&
            (x.Value.Name.Equals(value, StringComparison.OrdinalIgnoreCase) ||
             Enum.GetName(x.Value.Value)?.Equals(value, StringComparison.OrdinalIgnoreCase) == true)).Value;
        return direction != null;
    }

    private sealed record Unspecified() : TradeDirection(TradeDirectionValue.None, string.Empty, string.Empty);

    private sealed record BuyDirection() : TradeDirection(TradeDirectionValue.Buy, "Buy", "The portfolio bought the contracts");

    private sealed record SellDirection() : TradeDirection(TradeDirectionValue.Sell, "Sell", "The portfolio sold the contracts");
}
