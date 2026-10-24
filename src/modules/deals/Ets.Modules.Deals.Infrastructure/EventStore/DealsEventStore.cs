using Ets.Modules.Deals.Domain.Events;
using Ets.Modules.Deals.Infrastructure.EventStore.Serialization;
using JasperFx.Events;
using Marten;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

namespace Ets.Modules.Deals.Infrastructure.EventStore;

/// <summary>
///     The settings of <see cref="IDealsStore" />: its own schema, Guid stream ids (stream id = deal id) and the
///     JSON shape of the module's events.
/// </summary>
internal static class DealsEventStore
{
    /// <summary>The store's schema, separate from the EF Core <c>deals</c> schema so either can move alone.</summary>
    public const string Schema = "deals_events";

    /// <summary>
    ///     Builds the store's options over the host's shared <see cref="NpgsqlDataSource" /> (Aspire's
    ///     <c>AddNpgsqlDataSource</c>), so the connection string is never read here.
    /// </summary>
    internal static StoreOptions Configure(IServiceProvider services)
    {
        ArgumentNullException.ThrowIfNull(services);

        var options = new StoreOptions();

        options.Connection(services.GetRequiredService<NpgsqlDataSource>());
        options.DatabaseSchemaName = Schema;
        options.Events.DatabaseSchemaName = Schema;
        options.Events.StreamIdentity = StreamIdentity.AsGuid;
        options.UseSystemTextJsonForSerialization(configure: DealsEventJson.Configure);

        // Registered up front so reading a stream never meets an event type it has not seen.
        options.Events.AddEventType<AsxFuturesDealCaptured>();

        return options;
    }
}
