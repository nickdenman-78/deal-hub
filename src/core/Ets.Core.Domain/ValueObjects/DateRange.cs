// ReSharper disable MemberCanBeProtected.Global
// ReSharper disable MemberCanBePrivate.Global

namespace Ets.Core.Domain.ValueObjects;

public record DateRange : IEqualityComparer<DateRange>
{
    protected DateRange(DateOnly startDate, DateOnly endDate)
    {
        // always make sure the start date is on or before the end date
        if (startDate > endDate)
        {
            (startDate, endDate) = (endDate, startDate);
        }

        StartDate = startDate;
        EndDate = endDate;
    }

    [UsedImplicitly] public DateOnly StartDate { get; init; }

    [UsedImplicitly] public DateTime StartDateTime => StartDate.ToDateTime(TimeOnly.MinValue);

    [UsedImplicitly] public DateOnly EndDate { get; init; }

    [UsedImplicitly] public DateTime EndDateTime => EndDate.ToDateTime(TimeOnly.MaxValue);

    [UsedImplicitly] public int NumberOfDays => (EndDate.ToDateTime(TimeOnly.MinValue).AddDays(1) - StartDate.ToDateTime(TimeOnly.MinValue)).Days;

    [UsedImplicitly] public int NumberOfHours => NumberOfDays * 24;

    [UsedImplicitly] public int NumberOfMonths => CalculateMonths();

    public bool Equals(DateRange? x, DateRange? y)
    {
        if (ReferenceEquals(x, y))
        {
            return true;
        }

        if (x is null && y is null)
        {
            return true;
        }

        if (x is null || y is null)
        {
            return false;
        }

        if (x.GetType() != y.GetType())
        {
            return false;
        }

        return x.StartDate.Equals(y.StartDate) && x.EndDate.Equals(y.EndDate);
    }

    public int GetHashCode(DateRange? obj)
    {
        return obj != null ? HashCode.Combine(obj.StartDate, obj.EndDate) : 0;
    }

    [UsedImplicitly]
    public static DateRange Create(DateOnly startDate, DateOnly endDate)
    {
        return new DateRange(startDate, endDate);
    }

    [UsedImplicitly]
    public static DateRange Create(DateTime startDate, DateTime endDate)
    {
        return new DateRange(DateOnly.FromDateTime(startDate), DateOnly.FromDateTime(endDate));
    }

    public override string ToString()
    {
        return $"{StartDate:yyyy-MM-dd} - {EndDate:yyyy-MM-dd}";
    }

    [UsedImplicitly]
    public IEnumerable<DateOnly> GetDateSequence()
    {
        if (StartDate > EndDate)
        {
            yield break;
        }

        var date = StartDate;
        while (date <= EndDate)
        {
            yield return date;
            date = date.AddDays(1);
        }
    }

    private int CalculateMonths()
    {
        int months = 0;
        var date = StartDate;
        while (date <= EndDate)
        {
            date = date.AddMonths(1);
            months++;
        }

        return months;
    }
}
