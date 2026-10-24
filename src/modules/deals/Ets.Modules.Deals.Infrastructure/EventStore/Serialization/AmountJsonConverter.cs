using System.Text.Json;
using System.Text.Json.Serialization;
using Ets.Core.Domain.ValueObjects;

namespace Ets.Modules.Deals.Infrastructure.EventStore.Serialization;

/// <summary>An <see cref="Amount" /> as <c>{"value": 95.5, "unit": "DollarPerMWh"}</c>.</summary>
internal sealed class AmountJsonConverter : JsonConverter<Amount>
{
    public override Amount Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var (value, unit) = QuantityJson.Read<AmountUnitValue>(ref reader);

        return Amount.Create(value, unit);
    }

    public override void Write(Utf8JsonWriter writer, Amount value, JsonSerializerOptions options)
    {
        ArgumentNullException.ThrowIfNull(value);

        QuantityJson.Write(writer, value.RawValue, value.Unit.Value);
    }
}
