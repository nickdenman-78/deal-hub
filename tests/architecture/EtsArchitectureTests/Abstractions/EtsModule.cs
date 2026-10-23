using System.Reflection;

namespace EtsArchitectureTests.Abstractions;

/// <summary>
///     A module the architecture rules apply to, and the five layer assemblies it is made of.
/// </summary>
/// <param name="Name">The module name as it appears in <c>Ets.Modules.{Name}</c>.</param>
/// <param name="IsEventSourced">
///     Whether its aggregates are event sourced in Marten (Deals, Settlement — ADR-0013) or state-based in
///     EF Core.
/// </param>
/// <remarks>
///     Layer namespaces are read from each assembly's <c>AssemblyReference</c>, not typed as strings, so a
///     renamed namespace moves the rules with it instead of leaving them matching nothing.
///     <c>NamingConventionTests</c> then checks the read namespaces still follow the module convention.
/// </remarks>
internal sealed record EtsModule(
    string Name,
    bool IsEventSourced,
    Assembly Domain,
    Assembly Application,
    Assembly Infrastructure,
    Assembly IntegrationEvents,
    Assembly Presentation)
{
    public string Namespace => ModuleNamespace(Name);

    public string DomainNamespace => LayerNamespace(Domain);

    public string ApplicationNamespace => LayerNamespace(Application);

    public string InfrastructureNamespace => LayerNamespace(Infrastructure);

    public string IntegrationEventsNamespace => LayerNamespace(IntegrationEvents);

    public string PresentationNamespace => LayerNamespace(Presentation);

    public IReadOnlyList<Assembly> AllLayers => [Domain, Application, Infrastructure, IntegrationEvents, Presentation];

    public static string ModuleNamespace(string name)
    {
        return $"Ets.Modules.{name}";
    }

    /// <summary>
    ///     The namespaces of a module's internals — everything except its IntegrationEvents, which is the one
    ///     project other modules may reference (ADR-0004). Used for planned modules, which have no assemblies
    ///     yet, so these follow the naming convention by construction.
    /// </summary>
    public static IEnumerable<string> InternalNamespaces(string name)
    {
        string ns = ModuleNamespace(name);

        return [$"{ns}.Domain", $"{ns}.Application", $"{ns}.Infrastructure", $"{ns}.Presentation"];
    }

    public static string LayerNamespace(Assembly assembly)
    {
        ArgumentNullException.ThrowIfNull(assembly);

        var reference = assembly.GetTypes().SingleOrDefault(type => type.Name == "AssemblyReference");

        return reference?.Namespace ??
               throw new InvalidOperationException($"{assembly.GetName().Name} has no namespaced AssemblyReference.");
    }

    public override string ToString()
    {
        return Name;
    }
}
