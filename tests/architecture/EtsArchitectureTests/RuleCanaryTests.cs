using EtsArchitectureTests.Abstractions;
using Shouldly;
using static ArchUnitNET.Fluent.ArchRuleDefinition;
using static EtsArchitectureTests.Abstractions.EtsArchitecture;

namespace EtsArchitectureTests;

/// <summary>
///     Proves the "must not depend on" rules can fail. Each canary points a rule at a dependency that is known
///     to exist and asserts the rule sees it.
/// </summary>
/// <remarks>
///     ArchUnitNET fails a rule whose subjects are empty, but not one whose <c>NotDependOnAny</c> target is
///     empty. A target namespace that matches nothing — a typo, a renamed namespace, a referenced library that
///     is not being picked up — therefore passes forever and protects nothing. If a canary goes red, the rule it
///     shadows has stopped working: fix the namespace or the loading, not the canary.
/// </remarks>
public sealed class RuleCanaryTests
{
    public static TheoryData<string> Modules => EtsModules.Names;

    [Theory]
    [MemberData(nameof(Modules))]
    public void LayerNamespaces_ShouldMatch_RealDependencies(string moduleName)
    {
        var module = EtsModules.Named(moduleName);

        // Infrastructure's composition root calls Add{Module}Application, so this dependency always exists.
        Types().That().Are(TypesIn(module.Infrastructure))
            .Should().NotDependOnAny(TypesInNamespaces(module.ApplicationNamespace))
            .HasNoViolations(Architecture)
            .ShouldBeFalse(
                $"{module.Name}.Infrastructure depends on {module.ApplicationNamespace}, yet the rule did not see " +
                "it — layer namespace selection no longer matches the code.");
    }

    [Theory]
    [MemberData(nameof(Modules))]
    public void InternalNamespaces_ShouldMatch_RealDependencies(string moduleName)
    {
        var module = EtsModules.Named(moduleName);

        // ModuleIsolationTests builds foreign namespaces with EtsModule.InternalNamespaces; applied to the
        // module's own name the same list must catch Infrastructure → Application.
        Types().That().Are(TypesIn(module.Infrastructure))
            .Should().NotDependOnAny(TypesInNamespaces(EtsModule.InternalNamespaces(module.Name)))
            .HasNoViolations(Architecture)
            .ShouldBeFalse(
                "EtsModule.InternalNamespaces no longer produces namespaces that match real module code, so the " +
                "cross-module isolation rule asserts nothing.");
    }

    [Fact]
    public void PersistenceNamespaces_ShouldMatch_ReferencedLibraries()
    {
        // Ets.Core.Infrastructure holds DbContextBase, so it depends on EF Core — a referenced, not loaded,
        // assembly. This is the canary for Types(includeReferenced: true).
        Types().That().Are(TypesIn(CoreAssemblies.Infrastructure))
            .Should().NotDependOnAny(TypesInNamespaces(ForbiddenNamespaces.Persistence))
            .HasNoViolations(Architecture)
            .ShouldBeFalse(
                "ForbiddenNamespaces.Persistence did not catch EF Core: either the namespace is wrong or " +
                "referenced types are not being included.");
    }

    [Fact]
    public void WebNamespaces_ShouldMatch_ReferencedLibraries()
    {
        // Ets.Core.Presentation holds IEndpoint and the exception handler, so it depends on ASP.NET Core.
        Types().That().Are(TypesIn(CoreAssemblies.Presentation))
            .Should().NotDependOnAny(TypesInNamespaces(ForbiddenNamespaces.Web))
            .HasNoViolations(Architecture)
            .ShouldBeFalse("ForbiddenNamespaces.Web did not catch ASP.NET Core.");
    }

    [Fact]
    public void CoreLayerNamespaces_ShouldMatch_RealDependencies()
    {
        // Ets.Core.Infrastructure references Ets.Core.Domain (IContextUser, IAudited).
        Types().That().Are(TypesIn(CoreAssemblies.Infrastructure))
            .Should().NotDependOnAny(TypesInNamespaces(CoreAssemblies.DomainNamespace))
            .HasNoViolations(Architecture)
            .ShouldBeFalse("CoreAssemblies.DomainNamespace no longer matches the kernel's namespace.");
    }

    [Fact]
    public void NamespaceTreePattern_ShouldNotMatch_ASiblingWithTheSamePrefix()
    {
        // Ets.Modules.Risk must not swallow a future Ets.Modules.RiskReporting, or the Deals → Risk isolation
        // rule would forbid a module it says nothing about.
        string pattern = NamespaceTreePattern("Ets.Modules.Risk");

        System.Text.RegularExpressions.Regex.IsMatch("Ets.Modules.Risk", pattern).ShouldBeTrue();
        System.Text.RegularExpressions.Regex.IsMatch("Ets.Modules.Risk.Domain", pattern).ShouldBeTrue();
        System.Text.RegularExpressions.Regex.IsMatch("Ets.Modules.RiskReporting", pattern).ShouldBeFalse();
    }
}
