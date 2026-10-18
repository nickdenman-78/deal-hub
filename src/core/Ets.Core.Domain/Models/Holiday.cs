using System.Text.Json.Serialization;
using Ets.Core.Domain.ValueObjects;

namespace Ets.Core.Domain.Models;

public record Holiday(
    [property: UsedImplicitly]
    [property: JsonPropertyOrder(20)]
    HolidayState? HolidayState,
    [property: UsedImplicitly]
    [property: JsonPropertyOrder(10)]
    DateOnly Date,
    [property: UsedImplicitly]
    [property: JsonPropertyOrder(30)]
    string Name,
    [property: UsedImplicitly]
    [property: JsonPropertyOrder(40)]
    bool IsObserved = false
);
