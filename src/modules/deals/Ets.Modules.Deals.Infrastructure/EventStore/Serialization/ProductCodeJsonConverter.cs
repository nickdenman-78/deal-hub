using System.Text.Json;
using System.Text.Json.Serialization;
using Ets.Modules.Deals.Domain.ValueObjects;

namespace Ets.Modules.Deals.Infrastructure.EventStore.Serialization;

/// <summary>A <see cref="ProductCode" /> as its code (<c>"BNH26"</c>), decoded again on read.</summary>
internal sealed class ProductCodeJsonConverter : JsonConverter<ProductCode>
{
    public override ProductCode Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var productCode = ProductCode.Create(reader.GetString());

        return productCode.IsSuccess
            ? productCode.Value
            : throw new JsonException(productCode.Error!.Description);
    }

    public override void Write(Utf8JsonWriter writer, ProductCode value, JsonSerializerOptions options)
    {
        ArgumentNullException.ThrowIfNull(writer);
        ArgumentNullException.ThrowIfNull(value);

        writer.WriteStringValue(value.Value);
    }
}
