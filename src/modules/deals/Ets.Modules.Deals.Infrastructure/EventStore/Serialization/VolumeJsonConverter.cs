using System.Text.Json;
using System.Text.Json.Serialization;
using Ets.Core.Domain.ValueObjects;

namespace Ets.Modules.Deals.Infrastructure.EventStore.Serialization;

/// <summary>A <see cref="Volume" /> as <c>{"value": 5, "unit": "MW"}</c>.</summary>
internal sealed class VolumeJsonConverter : JsonConverter<Volume>
{
    public override Volume Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var (value, unit) = QuantityJson.Read<VolumeUnitValue>(ref reader);

        return Volume.Create(value, unit);
    }

    public override void Write(Utf8JsonWriter writer, Volume value, JsonSerializerOptions options)
    {
        ArgumentNullException.ThrowIfNull(value);

        QuantityJson.Write(writer, value.RawValue, value.Unit.Value);
    }
}
