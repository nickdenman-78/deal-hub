using System.Reflection;
using ArchUnitNET.Fluent;
using ArchUnitNET.Loader;
using ArchUnitNET.xUnitV3;
using EtsArchitectureTests.Abstractions;
using Shouldly;
using static ArchUnitNET.Fluent.ArchRuleDefinition;
using static EtsArchitectureTests.Abstractions.EtsArchitecture;

namespace EtsArchitectureTests;

/// <summary>
///     The host composes modules through their front doors only (ADR-0001, ADR-0003): a module's Infrastructure
///     (<c>Add{Module}Module</c>), its Presentation (<c>Add{Module}Endpoints</c>, <c>Map{Module}Module</c>) and its
///     IntegrationEvents (the permission catalogue). Reaching a module's Application or Domain would let the host
///     bypass the module's own composition root.
/// </summary>
public sealed class HostDependencyTests
{
    private static readonly Assembly Host = typeof(Ets.Servers.Api.IApiMarker).Assembly;

    // Loaded separately from the shared architecture: the host is not a layer the other rules range over.
    private static readonly ArchUnitNET.Domain.Architecture HostArchitecture = new ArchLoader().LoadAssemblies(Host).Build();

    public static TheoryData<string> Modules => EtsModules.Names;

    [Theory]
    [MemberData(nameof(Modules))]
    public void Host_ShouldNotDependOn_AModulesApplicationOrDomain(string moduleName)
    {
        var module = EtsModules.Named(moduleName);

        Types().That().ResideInAssembly(Host)
            .Should().NotDependOnAny(TypesInNamespaces(module.DomainNamespace, module.ApplicationNamespace))
            .Because($"the host reaches {module.Name} only through its Infrastructure, Presentation and " +
                     "IntegrationEvents")
            .Check(HostArchitecture);
    }

    [Fact]
    public void Host_ShouldDependOn_EachModulesCompositionRoots()
    {
        // The positive half: a module that is referenced but never composed is dead weight, and one that is
        // composed must be reached through both halves of its composition root.
        foreach (var module in EtsModules.All)
        {
            IArchRule rule = Types().That().ResideInAssembly(Host)
                .Should().NotDependOnAny(TypesInNamespaces(module.InfrastructureNamespace));

            rule.HasNoViolations(HostArchitecture).ShouldBeFalse(
                $"The host does not call Add{module.Name}Module — {module.Name} is referenced but not composed.");

            rule = Types().That().ResideInAssembly(Host)
                .Should().NotDependOnAny(TypesInNamespaces(module.PresentationNamespace));

            rule.HasNoViolations(HostArchitecture).ShouldBeFalse(
                $"The host does not call Add{module.Name}Endpoints / Map{module.Name}Module.");
        }
    }
}
