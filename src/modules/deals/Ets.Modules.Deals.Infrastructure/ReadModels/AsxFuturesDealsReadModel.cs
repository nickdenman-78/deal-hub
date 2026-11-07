using Ets.Modules.Deals.Application.Deals;
using Ets.Modules.Deals.Domain.Events;
using Ets.Modules.Deals.Infrastructure.Persistence;
using Ets.Modules.Deals.Infrastructure.Persistence.Entities;
using JasperFx.Events;
using JasperFx.Events.Daemon;
using JasperFx.Events.Projections;
using Marten;
using Marten.Subscriptions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Ets.Modules.Deals.Infrastructure.ReadModels;

/// <summary>
///     Keeps <c>deals.asx_futures_deals</c> in step with the deal event streams. A Marten subscription, run by the
///     async daemon: it reads <c>mt_events</c> in order and records how far it got, so every event arrives at
///     least once, after the capture has committed. No outbox is needed: the event store is the durable log.
/// </summary>
/// <remarks>
///     <para>
///         Idempotent: a row only moves forward in stream version, so a batch replayed after a crash changes
///         nothing. A new subscription starts from the first event, so deals captured before it existed are
///         written too.
///     </para>
///     <para>
///         After each page is saved it tells connected screens which deals changed
///         (<see cref="IDealsChangedNotifier" />). That notice is best effort: a failure is logged and never
///         holds up the read model.
///     </para>
/// </remarks>
[UsedImplicitly]
internal sealed partial class AsxFuturesDealsReadModel : SubscriptionBase
{
    private readonly IServiceScopeFactory _scopes;

    public AsxFuturesDealsReadModel(IServiceScopeFactory scopes)
    {
        _scopes = scopes;
        Name = "AsxFuturesDealsReadModel";
        IncludeType<AsxFuturesDealCaptured>();
    }

    public override async Task<IChangeListener> ProcessEventsAsync(
        EventRange page,
        ISubscriptionController controller,
        IDocumentOperations operations,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(page);

        var scope = _scopes.CreateAsyncScope();

        await using (scope.ConfigureAwait(false))
        {
            var db = scope.ServiceProvider.GetRequiredService<DealsDbContext>();
            var changed = new HashSet<Guid>();

            foreach (var @event in page.Events)
            {
                if (@event.Data is AsxFuturesDealCaptured captured
                    && await UpsertAsync(db, ToRow(captured, @event.Version), cancellationToken).ConfigureAwait(false))
                {
                    changed.Add(captured.DealId.Value);
                }
            }

            await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            await NotifyAsync(scope.ServiceProvider, changed, cancellationToken).ConfigureAwait(false);
        }

        return NullChangeListener.Instance;
    }

    /// <summary>The row a captured deal starts as.</summary>
    internal static DbAsxFuturesDeal ToRow(AsxFuturesDealCaptured captured, long version)
    {
        ArgumentNullException.ThrowIfNull(captured);

        var code = captured.Product.ProductCode;
        var commodity = code.CommodityCode;
        decimal lotSize = captured.Product.ContractSize.Energy.Value ?? 0m;
        decimal volume = captured.Volume.Value ?? 0m;

        return new DbAsxFuturesDeal
        {
            Id = captured.DealId.Value,
            Version = version,
            ProductCode = code.Value,
            Region = commodity.Region.Name,
            LoadProfile = commodity.LoadProfile.Name,
            Payoff = commodity.Payoff.Name,
            Period = commodity.Period.Name,
            Term = code.Term.Name,
            TermStart = code.Term.StartDate,
            TermEnd = code.Term.EndDate,
            ContractDays = captured.Product.ContractSize.NumberOfDays,
            ContractSize = lotSize,
            Direction = captured.Direction.Name,
            Price = captured.Price.Value ?? 0m,
            Volume = volume,
            ContractedEnergy = volume * lotSize,
            CapturedAt = captured.OccurredAt
        };
    }

    /// <returns>Whether the row was added or moved forward.</returns>
    private static async Task<bool> UpsertAsync(
        DealsDbContext db,
        DbAsxFuturesDeal row,
        CancellationToken cancellationToken)
    {
        var existing = await db.AsxFuturesDeals.FindAsync([row.Id], cancellationToken).ConfigureAwait(false);

        if (existing is null)
        {
            db.AsxFuturesDeals.Add(row);
            return true;
        }

        if (existing.Version < row.Version)
        {
            db.Entry(existing).CurrentValues.SetValues(row);
            return true;
        }

        return false;
    }

    /// <summary>
    ///     Tells screens which deals changed. Optional (a host without screens registers no notifier) and best
    ///     effort: a lost notice only means a screen refreshes later, while a thrown one would stall the read model.
    /// </summary>
    private static async Task NotifyAsync(
        IServiceProvider services,
        HashSet<Guid> changed,
        CancellationToken cancellationToken)
    {
        if (changed.Count == 0 || services.GetService<IDealsChangedNotifier>() is not { } notifier)
        {
            return;
        }

        try
        {
            await notifier.DealsChangedAsync(changed, cancellationToken).ConfigureAwait(false);
        }
#pragma warning disable CA1031 // Best effort by design: no failure to notify may stop the subscription.
        catch (Exception exception) when (exception is not OperationCanceledException)
#pragma warning restore CA1031
        {
            LogNotifyFailed(services.GetRequiredService<ILogger<AsxFuturesDealsReadModel>>(), exception, changed.Count);
        }
    }

    [LoggerMessage(Level = LogLevel.Warning, Message = "Could not notify screens that {DealCount} deals changed")]
    private static partial void LogNotifyFailed(ILogger logger, Exception exception, int dealCount);
}
