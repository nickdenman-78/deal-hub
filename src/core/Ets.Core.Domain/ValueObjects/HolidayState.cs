using System.Diagnostics.CodeAnalysis;

namespace Ets.Core.Domain.ValueObjects;

[SuppressMessage("Minor Code Smell", "S101:Types should be named in PascalCase")]
public record HolidayState : Enumeration<HolidayStateValue, HolidayState>
{
    [UsedImplicitly] public static readonly HolidayState NEM = new NEMHolidayState();
    [UsedImplicitly] public static readonly HolidayState QLD = new QLDHolidayState();
    [UsedImplicitly] public static readonly HolidayState NSW = new NSWHolidayState();
    [UsedImplicitly] public static readonly HolidayState ACT = new ACTHolidayState();
    [UsedImplicitly] public static readonly HolidayState VIC = new VICHolidayState();
    [UsedImplicitly] public static readonly HolidayState SA = new SAHolidayState();
    [UsedImplicitly] public static readonly HolidayState WA = new WAHolidayState();
    [UsedImplicitly] public static readonly HolidayState TAS = new TASHolidayState();
    [UsedImplicitly] public static readonly HolidayState NT = new NTHolidayState();

    private HolidayState(
        HolidayStateValue value,
        string name,
        string groupName,
        string? description = null
    ) : base(value, name)
    {
        GroupName = groupName;
        Description = description;
    }

    [UsedImplicitly] public string GroupName { get; init; }
    [UsedImplicitly] public string? Description { get; init; }

    private sealed record NEMHolidayState() : HolidayState(
        HolidayStateValue.NEM,
        "NEM",
        "Market",
        "National Electricity Market");

    private sealed record QLDHolidayState() : HolidayState(
        HolidayStateValue.QLD,
        "QLD",
        "Australian States",
        "Queensland"
    );

    private sealed record NSWHolidayState() : HolidayState(
        HolidayStateValue.NSW,
        "NSW",
        "Australian States",
        "New South Wales"
    );

    private sealed record ACTHolidayState() : HolidayState(
        HolidayStateValue.ACT,
        "ACT",
        "Australian States",
        "Australian Capital Territory"
    );

    private sealed record VICHolidayState() : HolidayState(
        HolidayStateValue.VIC,
        "VIC",
        "Australian States",
        "Victoria"
    );

    private sealed record SAHolidayState() : HolidayState(
        HolidayStateValue.SA,
        "SA",
        "Australian States",
        "South Australia"
    );

    private sealed record WAHolidayState() : HolidayState(
        HolidayStateValue.WA,
        "WA",
        "Australian States",
        "Western Australia"
    );

    private sealed record TASHolidayState() : HolidayState(
        HolidayStateValue.TAS,
        "TAS",
        "Australian States",
        "Tasmania"
    );

    private sealed record NTHolidayState() : HolidayState(
        HolidayStateValue.NT,
        "NT",
        "Australian States",
        "Northern Territory"
    );
}
