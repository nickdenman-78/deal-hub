namespace Ets.Core.Domain.ValueObjects;

public sealed record TimeRange // open interval [From, To)
    (TimeOnly From, TimeOnly To)
{
    [UsedImplicitly] public static TimeRange Empty => new(TimeOnly.MinValue, TimeOnly.MinValue);

    [UsedImplicitly] public bool IsEmpty => From == To;

    [UsedImplicitly] public bool IsNextDay => From > To;

    [UsedImplicitly]
    public bool Contains(TimeOnly time)
    {
        return time >= From && time < To;
    }

    [UsedImplicitly]
    public bool Overlaps(TimeRange? other)
    {
        return other != null && From < other.To && To > other.From;
    }

    [UsedImplicitly]
    public override string ToString()
    {
        return $"{From}-{To}";
    }
}
