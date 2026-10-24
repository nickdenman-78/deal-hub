using System.Text.Json;
using System.Text.Json.Serialization;
using Ets.Core.Domain.ValueObjects;

namespace Ets.Modules.Deals.Infrastructure.EventStore.Serialization;

/// <summary>
///     Any <see cref="Enumeration{TValue,TEnum}" /> as its <c>*Value</c> enum member name (<c>"Buy"</c>).
/// </summary>
/// <remarks>
///     The member name rather than the display name or ordinal, the same rule as EF Core columns (ADR-0010):
///     display names are reworded and ordinals reordered, member names are not.
/// </remarks>
internal sealed class EnumerationJsonConverterFactory : JsonConverterFactory
{
    public override bool CanConvert(Type typeToConvert)
    {
        return EnumerationArguments(typeToConvert) is [_, var enumeration] && enumeration == typeToConvert;
    }

    public override JsonConverter CreateConverter(Type typeToConvert, JsonSerializerOptions options)
    {
        var arguments = EnumerationArguments(typeToConvert) ??
                        throw new ArgumentException($"{typeToConvert.Name} is not an enumeration.", nameof(typeToConvert));

        return (JsonConverter)Activator.CreateInstance(typeof(EnumerationJsonConverter<,>).MakeGenericType(arguments))!;
    }

    private static Type[]? EnumerationArguments(Type type)
    {
        for (var current = type; current is not null; current = current.BaseType)
        {
            if (current.IsGenericType && current.GetGenericTypeDefinition() == typeof(Enumeration<,>))
            {
                return current.GetGenericArguments();
            }
        }

        return null;
    }

    private sealed class EnumerationJsonConverter<TValue, TEnum> : JsonConverter<TEnum>
        where TValue : struct, Enum
        where TEnum : Enumeration<TValue, TEnum>
    {
        public override TEnum Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            string? name = reader.GetString();

            return Enum.TryParse<TValue>(name, out var value) &&
                   Enumeration<TValue, TEnum>.FromValue(value) is { } enumeration
                ? enumeration
                : throw new JsonException($"'{name}' is not a {typeof(TEnum).Name}.");
        }

        public override void Write(Utf8JsonWriter writer, TEnum value, JsonSerializerOptions options)
        {
            ArgumentNullException.ThrowIfNull(writer);
            ArgumentNullException.ThrowIfNull(value);

            writer.WriteStringValue(value.Value.ToString());
        }
    }
}
