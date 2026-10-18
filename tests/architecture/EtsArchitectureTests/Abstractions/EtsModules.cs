namespace EtsArchitectureTests.Abstractions;

internal static class EtsModules
{
    /// <summary>
    ///     Modules that are not built yet (docs/architecture/architecture.md). Named here so the cross-module
    ///     isolation rules apply to them from the moment their first line of code exists, rather than being
    ///     switched on afterwards — the point at which a shortcut has usually already been taken.
    /// </summary>
    internal static readonly string[] PlannedModules =
    [
        "Settlement",
        "Risk",
        "Users",
        "MarketData",
        "Counterparties"
    ];

    internal static readonly EtsModule Deals = new(
        "Deals",
        true,
        Ets.Modules.Deals.Domain.AssemblyReference.Assembly,
        Ets.Modules.Deals.Application.AssemblyReference.Assembly,
        Ets.Modules.Deals.Infrastructure.AssemblyReference.Assembly,
        Ets.Modules.Deals.IntegrationEvents.AssemblyReference.Assembly,
        Ets.Modules.Deals.Presentation.AssemblyReference.Assembly);

    internal static readonly EtsModule[] All = [Deals];

    /// <summary>Theory data: one row per built module.</summary>
    internal static TheoryData<string> Names => new(All.Select(m => m.Name));

    internal static EtsModule Named(string name)
    {
        return All.Single(m => m.Name == name);
    }

    /// <summary>
    ///     The internal namespaces of every other module — built or planned — that
    ///     <paramref name="module" /> must not depend on. Their IntegrationEvents are deliberately absent.
    /// </summary>
    internal static string[] ForeignInternalNamespaces(EtsModule module)
    {
        return
        [
            .. PlannedModules
                .Concat(All.Select(m => m.Name))
                .Where(name => name != module.Name)
                .Distinct(StringComparer.Ordinal)
                .SelectMany(EtsModule.InternalNamespaces)
        ];
    }
}
