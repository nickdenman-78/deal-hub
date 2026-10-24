using System.Text.Json;

namespace Ets.Modules.Deals.Infrastructure.EventStore.Serialization;

/// <summary>
///     The JSON shape of the Deals events in <see cref="IDealsStore" />.
/// </summary>
/// <remarks>
///     Domain events carry value objects, which have private constructors and are made through factories.
///     Each converter writes a value object as its plain stored form and reads it back through its factory,
///     so a stored event depends on that form, never on a value object's internals. Changing a stored form is
///     changing a released event (ADR-0013).
/// </remarks>
internal static class DealsEventJson
{
    internal static void Configure(JsonSerializerOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        options.Converters.Add(new DealIdJsonConverter());
        options.Converters.Add(new ProductCodeJsonConverter());
        options.Converters.Add(new ContractSizeJsonConverter());
        options.Converters.Add(new AmountJsonConverter());
        options.Converters.Add(new VolumeJsonConverter());
        options.Converters.Add(new EnumerationJsonConverterFactory());
    }
}
