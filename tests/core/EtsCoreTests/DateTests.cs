using System.Text.Json;
using System.Text.Json.Serialization;
using Ets.Core.Domain.ValueObjects;

namespace EtsCoreTests;

public class DateTests(ITestOutputHelper output)
{
    private static readonly JsonSerializerOptions JsonSettings = new()
    {
        WriteIndented = true,
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        Converters = {new JsonStringEnumConverter()}
    };

    public static TheoryData<DateTime?, TimeZoneInfo?> DateTimeData =>
        new()
        {
            {new DateTime(2024, 3, 10, 09, 0, 0, DateTimeKind.Unspecified), TimeZoneInfo.FindSystemTimeZoneById("Australia/Brisbane")},
            {new DateTime(2024, 3, 10, 11, 0, 0, DateTimeKind.Unspecified), TimeZoneInfo.FindSystemTimeZoneById("Pacific Standard Time")},
            {new DateTime(2024, 3, 10, 13, 0, 0, DateTimeKind.Unspecified), TimeZoneInfo.FindSystemTimeZoneById("Eastern Standard Time")},
            {new DateTime(2024, 3, 10, 18, 0, 0, DateTimeKind.Unspecified), TimeZoneInfo.FindSystemTimeZoneById("UTC")},
            {null, null}
        };

    public static TheoryData<DateTimeOffset?> DateTimeOffsetData =>
        new()
        {
            new DateTimeOffset(2024, 3, 10, 12, 0, 0, TimeZoneInfo.FindSystemTimeZoneById("Australia/Brisbane").BaseUtcOffset),
            new DateTimeOffset(2024, 3, 10, 07, 18, 0, TimeZoneInfo.FindSystemTimeZoneById("Pacific Standard Time").BaseUtcOffset),
            new DateTimeOffset(2024, 3, 10, 09, 30, 0, TimeZoneInfo.FindSystemTimeZoneById("Eastern Standard Time").BaseUtcOffset),
            new DateTimeOffset(2024, 3, 10, 12, 0, 0, TimeZoneInfo.FindSystemTimeZoneById("UTC").BaseUtcOffset),
            (DateTimeOffset?)null
        };

    public static TheoryData<DateTimeOffset?, TimeZoneInfo?> DateTimeOffsetToTimeZoneData =>
        new()
        {
            {new DateTimeOffset(2024, 3, 10, 12, 0, 0, TimeZoneInfo.FindSystemTimeZoneById("Australia/Brisbane").BaseUtcOffset), TimeZoneInfo.Local},
            {new DateTimeOffset(2024, 3, 10, 12, 0, 0, TimeZoneInfo.FindSystemTimeZoneById("Pacific Standard Time").BaseUtcOffset), TimeZoneInfo.Utc},
            {new DateTimeOffset(2024, 3, 10, 12, 0, 0, TimeZoneInfo.FindSystemTimeZoneById("Eastern Standard Time").BaseUtcOffset), TimeZoneInfo.Local},
            {new DateTimeOffset(2024, 3, 10, 12, 0, 0, TimeZoneInfo.FindSystemTimeZoneById("UTC").BaseUtcOffset), TimeZoneInfo.Local},
            {null, null}
        };

    [Theory]
    [MemberData(nameof(DateTimeData))]
    public void Verify_DateValueFromDateTime(DateTime? input, TimeZoneInfo? timeZoneInfo)
    {
        var result = DateValue.Create(input, timeZoneInfo);
        string json = JsonSerializer.Serialize(new
        {
            input = new
            {
                value = input,
                timeZoneInfo
            },
            result
        }, JsonSettings);

        output.WriteLine(json);

        Assert.NotNull(result);
    }

    [Theory]
    [MemberData(nameof(DateTimeOffsetData))]
    public void Verify_DateValueFromDateTimeOffset(DateTimeOffset? input)
    {
        var result = DateValue.Create(input);
        string json = JsonSerializer.Serialize(new
        {
            input = new
            {
                value = input
            },
            result
        }, JsonSettings);

        output.WriteLine(json);

        Assert.NotNull(result);
    }

    [Theory]
    [MemberData(nameof(DateTimeOffsetToTimeZoneData))]
    public void Verify_DateValueFromDateTimeOffsetToTimeZone(DateTimeOffset? input, TimeZoneInfo? timeZoneInfo)
    {
        var result = DateValue.Create(input, timeZoneInfo);
        string json = JsonSerializer.Serialize(new
        {
            input = new
            {
                value = input
            },
            result
        }, JsonSettings);

        output.WriteLine(json);

        Assert.NotNull(result);
    }
}
