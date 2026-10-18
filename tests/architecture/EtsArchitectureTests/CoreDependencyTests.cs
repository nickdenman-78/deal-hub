using ArchUnitNET.xUnitV3;
using EtsArchitectureTests.Abstractions;
using Shouldly;
using static ArchUnitNET.Fluent.ArchRuleDefinition;
using static EtsArchitectureTests.Abstractions.EtsArchitecture;

namespace EtsArchitectureTests;

/// <summary>
///     The shared kernel's own layering. <c>src/core</c> is what every module may depend on, so it must depend
///     on no module, and its layers obey the same direction as a module's.
/// </summary>
public sealed class CoreDependencyTests
{
    [Fact]
    public void Core_ShouldNotDependOn_AnyModule()
    {
        Types().That().Are(TypesIn(CoreAssemblies.All))
            .Should().NotDependOnAny(TypesInNamespaces("Ets.Modules"))
            .Because("the shared kernel is depended on by modules, never the other way round")
            .Check(Architecture);
    }

    [Fact]
    public void CoreDomain_ShouldNotDependOn_AnyOtherCoreLayer()
    {
        Types().That().Are(TypesIn(CoreAssemblies.Domain))
            .Should().NotDependOnAny(TypesInNamespaces(
                CoreAssemblies.ApplicationNamespace,
                CoreAssemblies.InfrastructureNamespace,
                CoreAssemblies.PresentationNamespace))
            .Because("Ets.Core.Domain is the bottom of the graph")
            .Check(Architecture);
    }

    [Fact]
    public void CoreDomain_ShouldNotDependOn_PersistenceWebOrPlatform()
    {
        Types().That().Are(TypesIn(CoreAssemblies.Domain))
            .Should().NotDependOnAny(TypesInNamespaces(ForbiddenNamespaces.ForDomain))
            .Because("every module Domain references Ets.Core.Domain, so anything it depends on, every domain " +
                     "model inherits")
            .Check(Architecture);
    }

    [Fact]
    public void CoreApplication_ShouldNotDependOn_InfrastructureOrPresentation()
    {
        Types().That().Are(TypesIn(CoreAssemblies.Application))
            .Should().NotDependOnAny(TypesInNamespaces(
                CoreAssemblies.InfrastructureNamespace,
                CoreAssemblies.PresentationNamespace))
            .Because("Ets.Core.Application must depend on ports, not adapters")
            .Check(Architecture);
    }

    [Fact]
    public void CoreApplication_ShouldNotDependOn_PersistenceWebOrPlatform()
    {
        Types().That().Are(TypesIn(CoreAssemblies.Application))
            .Should().NotDependOnAny(TypesInNamespaces(ForbiddenNamespaces.ForDomain))
            .Because("Ets.Core.Application holds the clock and calendars; it has no adapter to wrap")
            .Check(Architecture);
    }

    [Fact]
    public void CoreInfrastructure_ShouldNotDependOn_Presentation()
    {
        Types().That().Are(TypesIn(CoreAssemblies.Infrastructure))
            .Should().NotDependOnAny(TypesInNamespaces(CoreAssemblies.PresentationNamespace))
            .Because("adapters do not know about endpoints")
            .Check(Architecture);
    }

    [Fact]
    public void CorePresentation_ShouldNotDependOn_Infrastructure()
    {
        Types().That().Are(TypesIn(CoreAssemblies.Presentation))
            .Should().NotDependOnAny(TypesInNamespaces(CoreAssemblies.InfrastructureNamespace))
            .Because("endpoints do not reach for a concrete adapter")
            .Check(Architecture);
    }

    [Fact]
    public void CoreHandlerImplementations_ShouldBe_OnlyTheDecorators()
    {
        // The kernel's validation and logging decorators implement the handler interfaces too. They are the
        // only kernel types that may: a use case in the kernel would be registered by no module's AddMediator.
        var implementations = TypeQueries.Handlers(CoreAssemblies.Domain)
            .Concat(TypeQueries.Handlers(CoreAssemblies.Application))
            .Concat(TypeQueries.Handlers(CoreAssemblies.Infrastructure))
            .Concat(TypeQueries.Handlers(CoreAssemblies.Presentation))
            .ToArray();
        implementations.ShouldNotBeVacuous("the kernel's decorators were not found");

        string decorators = $"{CoreAssemblies.DomainNamespace}.Decorators";

        implementations
            .Where(type => type.Namespace != decorators)
            .Select(type => type.FullName)
            .ShouldBeEmpty($"Kernel handler implementations live only in {decorators}.");
    }

    [Fact]
    public void EveryCoreLayer_ShouldExpose_AnAssemblyReference()
    {
        foreach (var layer in CoreAssemblies.All)
        {
            layer.GetTypes()
                .Any(type => type.Name == "AssemblyReference")
                .ShouldBeTrue(
                    $"{layer.GetName().Name} needs an AssemblyReference: a compile-time handle for DI scanning " +
                    "and for these tests.");
        }
    }
}
