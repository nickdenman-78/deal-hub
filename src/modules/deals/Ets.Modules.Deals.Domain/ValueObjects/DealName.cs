namespace Ets.Modules.Deals.Domain.ValueObjects;

public sealed record DealName
{
    private DealName(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException("Value cannot be null or whitespace.", nameof(value));
        }

        Value = value;
    }

    [UsedImplicitly] public string? Value { get; init; }

    [UsedImplicitly]
    public static DealName Create(string? value)
    {
        return new DealName(value);
    }

    public override string ToString()
    {
        return Value ?? string.Empty;
    }
}
