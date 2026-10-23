using System.Diagnostics.CodeAnalysis;
using Ets.Core.Domain.ValueObjects;

namespace Ets.Modules.Deals.Domain.ValueObjects;

/// <summary>
///     The trading window an ASX electricity futures contract covers, in AEST (market time).
/// </summary>
/// <remarks>
///     Base load runs 00:00-24:00. 24:00 is not a <see cref="TimeOnly" />, so its window ends at
///     <see cref="TimeOnly.MaxValue" />, the last instant of the day.
/// </remarks>
public abstract record LoadProfile : Enumeration<LoadProfileValue, LoadProfile>
{
    [UsedImplicitly] public static readonly LoadProfile None = new UnspecifiedLoadProfile();
    [UsedImplicitly] public static readonly LoadProfile BaseLoad = new BaseLoadProfile();
    [UsedImplicitly] public static readonly LoadProfile PeakLoad = new PeakLoadProfile();
    [UsedImplicitly] public static readonly LoadProfile MorningPeak = new MorningPeakLoadProfile();
    [UsedImplicitly] public static readonly LoadProfile EveningPeak = new EveningPeakLoadProfile();

    private LoadProfile(
        LoadProfileValue value,
        string name,
        TimeRange timeRange,
        bool weekdaysOnly,
        bool excludesPublicHolidays,
        string description) : base(value, name)
    {
        TimeRange = timeRange;
        WeekdaysOnly = weekdaysOnly;
        ExcludesPublicHolidays = excludesPublicHolidays;
        Description = description;
    }

    [UsedImplicitly] public TimeRange TimeRange { get; }

    [UsedImplicitly] public bool WeekdaysOnly { get; }

    [UsedImplicitly] public bool ExcludesPublicHolidays { get; }

    [UsedImplicitly] public string Description { get; }

    [UsedImplicitly]
    public static bool TryParse(string? value, [NotNullWhen(true)] out LoadProfile? profile)
    {
        profile = Enumerations.FirstOrDefault(x =>
            x.Value.Name.Equals(value, StringComparison.OrdinalIgnoreCase) ||
            Enum.GetName(x.Value.Value)?.Equals(value, StringComparison.OrdinalIgnoreCase) == true).Value;
        return profile != null;
    }

    private static TimeRange Window(int fromHour, int toHour)
    {
        return new TimeRange(new TimeOnly(fromHour, 0), new TimeOnly(toHour, 0));
    }

    private sealed record UnspecifiedLoadProfile() : LoadProfile(
        LoadProfileValue.None,
        string.Empty,
        TimeRange.Empty,
        false,
        false,
        string.Empty);

    private sealed record BaseLoadProfile() : LoadProfile(
        LoadProfileValue.BaseLoad,
        "Base load",
        new TimeRange(TimeOnly.MinValue, TimeOnly.MaxValue),
        false,
        false,
        "00:00-24:00 Monday to Sunday");

    private sealed record PeakLoadProfile() : LoadProfile(
        LoadProfileValue.PeakLoad,
        "Peak load",
        Window(7, 22),
        true,
        true,
        "07:00-22:00 Monday to Friday, excluding public holidays");

    private sealed record MorningPeakLoadProfile() : LoadProfile(
        LoadProfileValue.MorningPeak,
        "Morning peak",
        Window(6, 9),
        false,
        false,
        "06:00-09:00 Monday to Sunday");

    private sealed record EveningPeakLoadProfile() : LoadProfile(
        LoadProfileValue.EveningPeak,
        "Evening peak",
        Window(16, 21),
        false,
        false,
        "16:00-21:00 Monday to Sunday");
}
