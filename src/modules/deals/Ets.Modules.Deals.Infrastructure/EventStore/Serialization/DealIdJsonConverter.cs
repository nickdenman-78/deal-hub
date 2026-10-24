using System.Text.Json;
using System.Text.Json.Serialization;
using Ets.Modules.Deals.Domain.ValueObjects;

namespace Ets.Modules.Deals.Infrastructure.EventStore.Serialization;

/// <summary>A <see cref="DealId" /> as its Guid.</summary>
internal sealed class DealIdJsonConverter : JsonConverter<DealId>
{
    public override DealId Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        return new DealId(reader.GetGuid());
    }

    public override void Write(Utf8JsonWriter writer, DealId value, JsonSerializerOptions options)
    {
        ArgumentNullException.ThrowIfNull(writer);

        writer.WriteStringValue(value.Value);
    }
}
