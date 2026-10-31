using Ets.Modules.Deals.Infrastructure.Products;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Ets.Modules.Deals.Infrastructure.Persistence;

/// <summary>
///     In Development, applies the Deals EF Core migrations (the <c>deals</c> schema) and loads the ASX product
///     catalogue from <see cref="AsxProductCatalogueSeed" /> before the host starts taking requests (ADR-0010:
///     migrations run at startup in Development only). The event store needs nothing here: Marten creates its own
///     <c>deals_events</c> schema.
/// </summary>
/// <remarks>
///     Only products missing from the table are added, so a row edited by hand survives a restart.
/// </remarks>
[UsedImplicitly]
internal sealed partial class DealsDevelopmentMigrator(
    IServiceScopeFactory scopes,
    IHostEnvironment environment,
    ILogger<DealsDevelopmentMigrator> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        if (!environment.IsDevelopment())
        {
            return;
        }

        var scope = scopes.CreateAsyncScope();

        await using (scope.ConfigureAwait(false))
        {
            var db = scope.ServiceProvider.GetRequiredService<DealsDbContext>();

            await db.Database.MigrateAsync(cancellationToken).ConfigureAwait(false);

            var existing = (await db.AsxProducts
                    .AsNoTracking()
                    .Select(product => product.ProductCode)
                    .ToListAsync(cancellationToken)
                    .ConfigureAwait(false))
                .ToHashSet(StringComparer.Ordinal);

            var missing = AsxProductCatalogueSeed.Load()
                .Where(product => !existing.Contains(product.ProductCode))
                .ToList();

            db.AsxProducts.AddRange(missing);
            await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            LogMigrated(logger, missing.Count);
        }
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }

    [LoggerMessage(Level = LogLevel.Information,
        Message = "Applied the Deals migrations and added {ProductCount} ASX products to the catalogue")]
    private static partial void LogMigrated(ILogger logger, int productCount);
}
