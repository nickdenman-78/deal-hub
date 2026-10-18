using ArchUnitNET.xUnitV3;
using EtsArchitectureTests.Abstractions;
using static ArchUnitNET.Fluent.ArchRuleDefinition;
using static EtsArchitectureTests.Abstractions.EtsArchitecture;

namespace EtsArchitectureTests;

/// <summary>
///     The reference graph each module must obey (ADR-0001), one rule per forbidden direction:
///     <code>
///     Domain            → Ets.Core.Domain
///     IntegrationEvents → (nothing)
///     Application       → Domain, Ets.Core.Domain
///     Infrastructure    → Application, IntegrationEvents, Ets.Core.Infrastructure
///     Presentation      → Application, Ets.Core.Presentation
///     </code>
///     The project references already make most violations fail to compile; these catch what a transitive
///     reference lets through, and keep holding when someone adds a reference to "just fix the build".
/// </summary>
public sealed class LayerDependencyTests
{
    public static TheoryData<string> Modules => EtsModules.Names;

    [Theory]
    [MemberData(nameof(Modules))]
    public void Domain_ShouldNotDependOn_AnyOtherLayer(string moduleName)
    {
        var module = EtsModules.Named(moduleName);

        Types().That().Are(TypesIn(module.Domain))
            .Should().NotDependOnAny(TypesInNamespaces(
                module.ApplicationNamespace,
                module.InfrastructureNamespace,
                module.IntegrationEventsNamespace,
                module.PresentationNamespace))
            .Because($"{module.Name}.Domain must not know about the layers around it")
            .Check(Architecture);
    }

    [Theory]
    [MemberData(nameof(Modules))]
    public void Domain_ShouldNotDependOn_PersistenceWebOrPlatform(string moduleName)
    {
        var module = EtsModules.Named(moduleName);

        Types().That().Are(TypesIn(module.Domain))
            .Should().NotDependOnAny(TypesInNamespaces(ForbiddenNamespaces.ForDomain))
            .Because($"{module.Name}.Domain must not know how it is stored, transported, messaged, scheduled " +
                     "or cached")
            .Check(Architecture);
    }

    [Theory]
    [MemberData(nameof(Modules))]
    public void Application_ShouldNotDependOn_InfrastructurePresentationOrIntegrationEvents(string moduleName)
    {
        var module = EtsModules.Named(moduleName);

        // Application declares ports; Infrastructure implements them. Mapping domain events to this module's
        // integration events happens in the unit of work, in Infrastructure, so Application has no reason to
        // see its own public contract either.
        Types().That().Are(TypesIn(module.Application))
            .Should().NotDependOnAny(TypesInNamespaces(
                module.InfrastructureNamespace,
                module.PresentationNamespace,
                module.IntegrationEventsNamespace))
            .Because($"{module.Name}.Application must depend on ports, not adapters")
            .Check(Architecture);
    }

    [Theory]
    [MemberData(nameof(Modules))]
    public void Application_ShouldNotDependOn_DriverWebOrPlatform(string moduleName)
    {
        var module = EtsModules.Named(moduleName);

        // ADR-0011: an architecture test asserts no Domain or Application project references Wolverine.
        Types().That().Are(TypesIn(module.Application))
            .Should().NotDependOnAny(TypesInNamespaces(ForbiddenNamespaces.ForApplication))
            .Because($"{module.Name}.Application reaches Wolverine, Marten, Quartz, FusionCache, Npgsql and " +
                     "ASP.NET Core only through ports")
            .Check(Architecture);
    }

    [Theory]
    [MemberData(nameof(Modules))]
    public void Presentation_ShouldNotDependOn_Infrastructure(string moduleName)
    {
        var module = EtsModules.Named(moduleName);

        Types().That().Are(TypesIn(module.Presentation))
            .Should().NotDependOnAny(TypesInNamespaces(module.InfrastructureNamespace))
            .Because($"{module.Name}.Presentation must stay composable with any adapters")
            .Check(Architecture);
    }

    [Theory]
    [MemberData(nameof(Modules))]
    public void Presentation_ShouldNotDependOn_PersistenceOrPlatform(string moduleName)
    {
        var module = EtsModules.Named(moduleName);

        Types().That().Are(TypesIn(module.Presentation))
            .Should().NotDependOnAny(TypesInNamespaces(
                [.. ForbiddenNamespaces.Persistence, .. ForbiddenNamespaces.Platform]))
            .Because($"{module.Name}.Presentation calls handlers; it does not query the database or publish " +
                     "messages itself")
            .Check(Architecture);
    }

    [Theory]
    [MemberData(nameof(Modules))]
    public void Infrastructure_ShouldNotDependOn_Presentation(string moduleName)
    {
        var module = EtsModules.Named(moduleName);

        // Both halves of the composition root are called by the host (ADR-0003); neither needs the other.
        Types().That().Are(TypesIn(module.Infrastructure))
            .Should().NotDependOnAny(TypesInNamespaces(module.PresentationNamespace))
            .Because($"{module.Name}.Infrastructure must not depend on the web layer")
            .Check(Architecture);
    }

    [Theory]
    [MemberData(nameof(Modules))]
    public void DomainAndApplication_ShouldNotDependOn_KernelAdaptersOrWeb(string moduleName)
    {
        var module = EtsModules.Named(moduleName);

        Types().That().Are(TypesIn([module.Domain, module.Application]))
            .Should().NotDependOnAny(TypesInNamespaces(
                CoreAssemblies.InfrastructureNamespace,
                CoreAssemblies.PresentationNamespace))
            .Because($"{module.Name}.Domain and .Application may use the kernel's Domain and Application only")
            .Check(Architecture);
    }

    [Theory]
    [MemberData(nameof(Modules))]
    public void Presentation_ShouldNotDependOn_KernelAdapters(string moduleName)
    {
        var module = EtsModules.Named(moduleName);

        Types().That().Are(TypesIn(module.Presentation))
            .Should().NotDependOnAny(TypesInNamespaces(CoreAssemblies.InfrastructureNamespace))
            .Because($"{module.Name}.Presentation must not use the kernel's adapters")
            .Check(Architecture);
    }

    [Theory]
    [MemberData(nameof(Modules))]
    public void Infrastructure_ShouldNotDependOn_KernelWebTypes(string moduleName)
    {
        var module = EtsModules.Named(moduleName);

        Types().That().Are(TypesIn(module.Infrastructure))
            .Should().NotDependOnAny(TypesInNamespaces(CoreAssemblies.PresentationNamespace))
            .Because($"{module.Name}.Infrastructure must not use the kernel's web types")
            .Check(Architecture);
    }
}
