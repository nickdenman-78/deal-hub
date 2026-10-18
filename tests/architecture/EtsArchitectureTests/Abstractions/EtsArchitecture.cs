using System.Reflection;
using System.Text.RegularExpressions;
using ArchUnitNET.Domain;
using ArchUnitNET.Fluent;
using ArchUnitNET.Loader;
using static ArchUnitNET.Fluent.ArchRuleDefinition;
using Architecture = ArchUnitNET.Domain.Architecture;
using Assembly = System.Reflection.Assembly;

namespace EtsArchitectureTests.Abstractions;

/// <summary>
///     The ArchUnitNET model of ETS, loaded once for the whole test run, and the type sets rules are written
///     against.
/// </summary>
/// <remarks>
///     <para>
///         Loading reads every assembly's IL, which is the expensive part of an ArchUnitNET test; doing it once
///         in a static keeps the suite fast.
///     </para>
///     <para>
///         Subjects are selected <em>by assembly</em> (<see cref="TypesIn" />), which cannot silently match
///         nothing after a rename. Targets of a "must not depend on" rule are selected by namespace
///         (<see cref="TypesInNamespaces" />) because most of them — EF Core, Wolverine, other modules — are not
///         loaded; those are covered by <c>RuleCanaryTests</c>.
///     </para>
/// </remarks>
internal static class EtsArchitecture
{
    internal static readonly Architecture Architecture = new ArchLoader()
        .LoadAssemblies([.. CoreAssemblies.All, .. EtsModules.All.SelectMany(module => module.AllLayers)])
        .Build();

    /// <summary>Every type declared in <paramref name="assembly" />.</summary>
    internal static IObjectProvider<IType> TypesIn(Assembly assembly)
    {
        ArgumentNullException.ThrowIfNull(assembly);

        return Types().That().ResideInAssembly(assembly).As(assembly.GetName().Name ?? assembly.FullName ?? "?");
    }

    /// <summary>Every type declared in any of <paramref name="assemblies" />.</summary>
    internal static IObjectProvider<IType> TypesIn(IEnumerable<Assembly> assemblies)
    {
        Assembly[] list = [.. assemblies];

        if (list.Length == 0)
        {
            throw new ArgumentException("At least one assembly is required.", nameof(assemblies));
        }

        return Types()
            .That()
            .ResideInAssembly(list[0], list[1..])
            .As(string.Join(", ", list.Select(assembly => assembly.GetName().Name)));
    }

    /// <summary>
    ///     Every type — loaded or merely referenced — in any of <paramref name="namespaces" /> or beneath them.
    /// </summary>
    /// <remarks>
    ///     <c>Types(true)</c> includes referenced types, which is what makes a rule about EF Core or Wolverine
    ///     see their types without loading those assemblies. The pattern matches a namespace and its children
    ///     only — <c>Ets.Modules.Risk</c> never matches <c>Ets.Modules.RiskReporting</c>.
    /// </remarks>
    internal static IObjectProvider<IType> TypesInNamespaces(params IEnumerable<string> namespaces)
    {
        string[] list = [.. namespaces];

        if (list.Length == 0)
        {
            throw new ArgumentException("At least one namespace is required.", nameof(namespaces));
        }

        return Types(true)
            .That()
            .ResideInNamespaceMatching(NamespaceTreePattern(list))
            .As(string.Join(", ", list));
    }

    /// <summary>A regex matching any of <paramref name="namespaces" /> and their child namespaces.</summary>
    internal static string NamespaceTreePattern(params IEnumerable<string> namespaces)
    {
        return $"^(?:{string.Join('|', namespaces.Select(Regex.Escape))})(?:\\..+)?$";
    }
}
