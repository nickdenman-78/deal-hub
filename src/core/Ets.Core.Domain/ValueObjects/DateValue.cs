using System.Text.Json.Serialization;

namespace Ets.Core.Domain.ValueObjects;

public record DateValue
{
    private DateValue(DateTime? value, TimeZoneInfo? timeZone)
    {
        timeZone ??= TimeZoneInfo.Local;

        var dateTimeOffset = value.HasValue
            ? new DateTimeOffset(value.Value, timeZone.BaseUtcOffset)
            : (DateTimeOffset?)null;

        Value = dateTimeOffset;
        DatePart = value.HasValue ? DateOnly.FromDateTime(value.Value) : null;
        TimePart = value.HasValue ? TimeOnly.FromDateTime(value.Value) : null;
        TimeZoneInfo = timeZone;
    }

    [UsedImplicitly]
    [JsonPropertyOrder(10)]
    public DateTimeOffset? Value { get; private init; }

    [UsedImplicitly]
    [JsonPropertyOrder(20)]
    public DateOnly? DatePart { get; private init; }

    [UsedImplicitly]
    [JsonPropertyOrder(30)]
    public TimeOnly? TimePart { get; private init; }

    [UsedImplicitly]
    [JsonPropertyOrder(40)]
    public DateTime? LocalDateTime => Value?.ToLocalTime().DateTime;

    [UsedImplicitly]
    [JsonPropertyOrder(50)]
    public DateOnly? LocalDate => Value.HasValue ? DateOnly.FromDateTime(Value.Value.ToLocalTime().DateTime) : null;

    [UsedImplicitly]
    [JsonPropertyOrder(60)]
    public TimeOnly? LocalTime => Value.HasValue ? TimeOnly.FromDateTime(Value.Value.ToLocalTime().DateTime) : null;

    [UsedImplicitly]
    [JsonPropertyOrder(900)]
    public TimeZoneInfo? TimeZoneInfo { get; private init; }

#pragma warning disable CA1822
    [UsedImplicitly]
    [JsonPropertyOrder(910)]
    public TimeZoneInfo LocalTimeZoneInfo => TimeZoneInfo.Local;
#pragma warning restore CA1822

    [UsedImplicitly]
    public static DateValue Create(DateTime? value)
    {
        return Create(value, TimeZoneInfo.Local);
    }

    [UsedImplicitly]
    public static DateValue Create(DateTime? value, TimeZoneInfo? timeZone)
    {
        return new DateValue(value, timeZone);
    }

    [UsedImplicitly]
    public static DateValue Create(DateTimeOffset? value)
    {
        return Create(value, TimeZoneInfo.Local);
    }

    [UsedImplicitly]
    public static DateValue Create(DateTimeOffset? value, TimeZoneInfo? timeZone)
    {
        timeZone ??= TimeZoneInfo.Local;
        var dateTimeLocal = value?.ToOffset(timeZone.BaseUtcOffset).DateTime;
        return new DateValue(dateTimeLocal, timeZone);
    }

    [UsedImplicitly]
    public static DateValue Create(DateOnly value)
    {
        return Create(value.ToDateTime(TimeOnly.MinValue));
    }

    [UsedImplicitly]
    public static DateValue Create(DateOnly value, TimeZoneInfo? timeZone)
    {
        return Create(value.ToDateTime(TimeOnly.MinValue), timeZone);
    }
}
