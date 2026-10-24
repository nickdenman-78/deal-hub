using System.Text.Json;

namespace Ets.Modules.Deals.Infrastructure.EventStore.Serialization;

/// <summary>
///     The stored form shared by <c>Amount</c> and <c>Volume</c>: <c>{"value": 95.5, "unit": "DollarPerMWh"}</c>.
///     The value is the unrounded one the factory was given; the unit is its <c>*Value</c> enum member name.
/// </summary>
internal static class QuantityJson
{
    private const string UnitProperty = "unit";
    private const string ValueProperty = "value";

    internal static (decimal? Value, TUnit Unit) Read<TUnit>(ref Utf8JsonReader reader)
        where TUnit : struct, Enum
    {
        if (reader.TokenType != JsonTokenType.StartObject)
        {
            throw new JsonException("Expected a quantity object.");
        }

        decimal? value = null;
        string? unit = null;

        while (reader.Read() && reader.TokenType != JsonTokenType.EndObject)
        {
            string? property = reader.GetString();
            reader.Read();

            switch (property)
            {
                case ValueProperty:
                    value = reader.TokenType == JsonTokenType.Null ? null : reader.GetDecimal();
                    break;
                case UnitProperty:
                    unit = reader.GetString();
                    break;
                default:
                    reader.Skip();
                    break;
            }
        }

        return Enum.TryParse<TUnit>(unit, out var parsed) && Enum.IsDefined(parsed)
            ? (value, parsed)
            : throw new JsonException($"'{unit}' is not a {typeof(TUnit).Name}.");
    }

    internal static void Write<TUnit>(Utf8JsonWriter writer, decimal? value, TUnit unit)
        where TUnit : struct, Enum
    {
        ArgumentNullException.ThrowIfNull(writer);

        writer.WriteStartObject();

        if (value is { } number)
        {
            writer.WriteNumber(ValueProperty, number);
        }
        else
        {
            writer.WriteNull(ValueProperty);
        }

        writer.WriteString(UnitProperty, unit.ToString());
        writer.WriteEndObject();
    }
}
