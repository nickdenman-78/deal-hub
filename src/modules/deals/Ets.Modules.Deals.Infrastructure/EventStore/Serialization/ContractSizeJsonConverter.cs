using System.Text.Json;
using System.Text.Json.Serialization;
using Ets.Core.Domain.ValueObjects;
using Ets.Modules.Deals.Domain.ValueObjects;

namespace Ets.Modules.Deals.Infrastructure.EventStore.Serialization;

/// <summary>
///     A <see cref="ContractSize" /> as <c>{"numberOfDays": 90, "energy": {"value": 2160, "unit": "MWh"}}</c>.
/// </summary>
internal sealed class ContractSizeJsonConverter : JsonConverter<ContractSize>
{
    private const string EnergyProperty = "energy";
    private const string NumberOfDaysProperty = "numberOfDays";

    public override ContractSize Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType != JsonTokenType.StartObject)
        {
            throw new JsonException("Expected a contract size object.");
        }

        int numberOfDays = 0;
        Volume? energy = null;

        while (reader.Read() && reader.TokenType != JsonTokenType.EndObject)
        {
            string? property = reader.GetString();
            reader.Read();

            switch (property)
            {
                case NumberOfDaysProperty:
                    numberOfDays = reader.GetInt32();
                    break;
                case EnergyProperty:
                    energy = JsonSerializer.Deserialize<Volume>(ref reader, options);
                    break;
                default:
                    reader.Skip();
                    break;
            }
        }

        var contractSize = ContractSize.Create(
            numberOfDays,
            energy ?? throw new JsonException("A contract size has no energy."));

        return contractSize.IsSuccess
            ? contractSize.Value
            : throw new JsonException(contractSize.Error!.Description);
    }

    public override void Write(Utf8JsonWriter writer, ContractSize value, JsonSerializerOptions options)
    {
        ArgumentNullException.ThrowIfNull(writer);
        ArgumentNullException.ThrowIfNull(value);

        writer.WriteStartObject();
        writer.WriteNumber(NumberOfDaysProperty, value.NumberOfDays);
        writer.WritePropertyName(EnergyProperty);
        JsonSerializer.Serialize(writer, value.Energy, options);
        writer.WriteEndObject();
    }
}
