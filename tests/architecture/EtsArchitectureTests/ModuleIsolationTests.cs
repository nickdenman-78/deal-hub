using ArchUnitNET.xUnitV3;
using EtsArchitectureTests.Abstractions;
using Shouldly;
using static ArchUnitNET.Fluent.ArchRuleDefinition;
using static EtsArchitectureTests.Abstractions.EtsArchitecture;

namespace EtsArchitectureTests;

/// <summary>
///     A module's IntegrationEvents project is its public API — the only project another module or the host
///     may reference (ADR-0004). Everything else is internal to the module.
/// </summary>
/// <remarks>
///     Rules whose target namespaces are computed guard them with <c>ShouldNotBeVacuous</c>; ArchUnitNET's
///     empty-set check covers a rule's subjects, not the set passed to <c>NotDependOnAny</c>.
/// </remarks>
public sealed class ModuleIsolationTests
{
    public static TheoryData<string> Modules => EtsModules.Names;

    [Theory]
    [MemberData(nameof(Modules))]
    public void Module_ShouldNotDependOn_AnotherModulesInternals(string moduleName)
    {
        var module = EtsModules.Named(moduleName);

        string[] foreign = EtsModules.ForeignInternalNamespaces(module);
        foreign.ShouldNotBeVacuous($"no foreign module namespaces were computed for {module.Name}");

        Types().That().Are(TypesIn(module.AllLayers))
            .Should().NotDependOnAny(TypesInNamespaces(foreign))
            .Because($"{module.Name} must reach other modules only through their IntegrationEvents contract, " +
                     "never their Domain, Application, Infrastructure or Presentation")
            .Check(Architecture);
    }

    [Theory]
    [MemberData(nameof(Modules))]
    public void IntegrationEvents_ShouldNotDependOn_TheModulesOwnInternals(string moduleName)
    {
        var module = EtsModules.Named(moduleName);

        // Every dependency the public API takes is one each consuming module inherits.
        Types().That().Are(TypesIn(module.IntegrationEvents))
            .Should().NotDependOnAny(TypesInNamespaces(
                module.DomainNamespace,
                module.ApplicationNamespace,
                module.InfrastructureNamespace,
                module.PresentationNamespace))
            .Because($"{module.Name}.IntegrationEvents is the module's public contract and must not drag its " +
                     "internals along")
            .Check(Architecture);
    }

    [Theory]
    [MemberData(nameof(Modules))]
    public void IntegrationEvents_ShouldNotDependOn_TheKernelOrPlatform(string moduleName)
    {
        var module = EtsModules.Named(moduleName);

        // ADR-0011: published contracts are plain, versioned records — no Wolverine or kernel types — so a
        // consumer or an external subscriber can deserialise them without our libraries.
        Types().That().Are(TypesIn(module.IntegrationEvents))
            .Should().NotDependOnAny(TypesInNamespaces(["Ets.Core", .. ForbiddenNamespaces.ForDomain]))
            .Because($"{module.Name}.IntegrationEvents must carry plain types only (Guid, string, decimal, dates)")
            .Check(Architecture);
    }

    [Theory]
    [MemberData(nameof(Modules))]
    public void IntegrationEvents_ShouldNotDependOn_AnotherModulesPublicApi(string moduleName)
    {
        var module = EtsModules.Named(moduleName);

        string[] otherPublicApis =
        [
            .. EtsModules.PlannedModules
                .Concat(EtsModules.All.Select(m => m.Name))
                .Where(name => name != module.Name)
                .Distinct(StringComparer.Ordinal)
                .Select(name => $"{EtsModule.ModuleNamespace(name)}.IntegrationEvents")
        ];
        otherPublicApis.ShouldNotBeVacuous($"no other module contracts were computed for {module.Name}");

        // A contract embedding another module's contract couples every consumer to both release cycles.
        Types().That().Are(TypesIn(module.IntegrationEvents))
            .Should().NotDependOnAny(TypesInNamespaces(otherPublicApis))
            .Because($"{module.Name}.IntegrationEvents must stand alone; copy the fields you need instead")
            .Check(Architecture);
    }

    [Fact]
    public void EveryModuleLayer_ShouldExpose_AnAssemblyReference()
    {
        var layers = EtsModules.All.SelectMany(m => m.AllLayers).ToArray();
        layers.ShouldNotBeVacuous("no module layer assemblies were discovered");

        foreach (var layer in layers)
        {
            layer.GetTypes()
                .Any(type => type.Name == "AssemblyReference")
                .ShouldBeTrue(
                    $"{layer.GetName().Name} needs an AssemblyReference. Without a compile-time handle these " +
                    "rules fall back to string matching, which is how they end up asserting nothing.");
        }
    }

    [Theory]
    [MemberData(nameof(Modules))]
    public void EveryModuleLayer_ShouldLive_InItsOwnNamespace(string moduleName)
    {
        var module = EtsModules.Named(moduleName);

        (string Namespace, System.Reflection.Assembly Assembly)[] layers =
        [
            (module.DomainNamespace, module.Domain),
            (module.ApplicationNamespace, module.Application),
            (module.InfrastructureNamespace, module.Infrastructure),
            (module.IntegrationEventsNamespace, module.IntegrationEvents),
            (module.PresentationNamespace, module.Presentation)
        ];

        // The namespace rules only mean something if a layer's types are in that layer's namespace.
        foreach (var (ns, assembly) in layers)
        {
            string[] strays =
            [
                .. assembly.GetTypes()
                    .Where(IsAuthoredTopLevelType)
                    .Where(type => type.Namespace != ns &&
                                   type.Namespace?.StartsWith(ns + ".", StringComparison.Ordinal) != true)
                    .Select(type => type.FullName ?? type.Name)
            ];

            strays.ShouldBeEmpty($"Every type in {assembly.GetName().Name} must be in {ns}.");
        }
    }

    /// <summary>
    ///     Excludes what the compiler emits into every assembly — <c>&lt;Module&gt;</c>, closure classes and the
    ///     embedded <c>NullableAttribute</c>-style types under <c>System</c> and <c>Microsoft.CodeAnalysis</c>.
    /// </summary>
    private static bool IsAuthoredTopLevelType(Type type)
    {
        return !type.IsNested &&
               !type.Name.StartsWith('<') &&
               !type.IsDefined(typeof(System.Runtime.CompilerServices.CompilerGeneratedAttribute), false) &&
               type.Namespace is { } ns &&
               !ns.StartsWith("System", StringComparison.Ordinal) &&
               !ns.StartsWith("Microsoft.CodeAnalysis", StringComparison.Ordinal);
    }
}
