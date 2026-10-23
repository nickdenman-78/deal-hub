using ArchUnitNET.xUnitV3;
using EtsArchitectureTests.Abstractions;
using Shouldly;
using static ArchUnitNET.Fluent.ArchRuleDefinition;
using static EtsArchitectureTests.Abstractions.EtsArchitecture;

namespace EtsArchitectureTests;

/// <summary>
///     Endpoint conventions (ADR-0002): one <c>internal sealed class : IEndpoint</c> per slice, in the module's
///     Presentation, resolvable from the root provider.
/// </summary>
/// <remarks>
///     The subject set is found by reflection and handed to ArchUnitNET with <c>Are(types)</c>, so a module
///     with no endpoints yet is skipped rather than failing ArchUnitNET's empty-subject check.
/// </remarks>
public sealed class EndpointConventionTests
{
    public static TheoryData<string> Modules => EtsModules.Names;

    [Theory]
    [MemberData(nameof(Modules))]
    public void Endpoints_ShouldBe_Sealed(string moduleName)
    {
        var module = EtsModules.Named(moduleName);
        var endpoints = TypeQueries.Endpoints(module.Presentation)
            .SkipWhenNone($"{module.Name}.Presentation declares no endpoints");

        Classes().That().Are(endpoints)
            .Should().BeSealed()
            .Because("endpoints are leaves: one per slice, nothing derives from them")
            .Check(Architecture);
    }

    [Theory]
    [MemberData(nameof(Modules))]
    public void Endpoints_ShouldBe_Internal(string moduleName)
    {
        var module = EtsModules.Named(moduleName);
        var endpoints = TypeQueries.Endpoints(module.Presentation)
            .SkipWhenNone($"{module.Name}.Presentation declares no endpoints");

        Classes().That().Are(endpoints)
            .Should().BeInternal()
            .Because("endpoints are reached through routing, not by other code, so nothing outside the module's " +
                     "presentation layer should be able to name one")
            .Check(Architecture);
    }

    [Theory]
    [MemberData(nameof(Modules))]
    public void Endpoints_ShouldHave_AParameterlessConstructor(string moduleName)
    {
        var module = EtsModules.Named(moduleName);
        var endpoints = TypeQueries.Endpoints(module.Presentation)
            .SkipWhenNone($"{module.Name}.Presentation declares no endpoints");

        // MapEndpoints resolves these from the ROOT provider. A constructor dependency would either capture a
        // scoped service or fail at startup; per-request services belong on the route delegate.
        endpoints
            .Where(endpoint => !endpoint.GetConstructors().Any(constructor => constructor.GetParameters().Length == 0))
            .Select(endpoint => endpoint.Name)
            .ShouldBeEmpty("Endpoints have a parameterless constructor and take per-request services on the route delegate.");
    }

    [Theory]
    [MemberData(nameof(Modules))]
    public void Endpoints_ShouldLive_OnlyInPresentation(string moduleName)
    {
        var module = EtsModules.Named(moduleName);

        foreach (var layer in new[] {module.Domain, module.Application, module.Infrastructure, module.IntegrationEvents})
        {
            TypeQueries.Endpoints(layer).ShouldBeEmpty(
                $"{layer.GetName().Name} declares an endpoint. Routes belong in Presentation, where " +
                "Add{Module}Endpoints discovers them.");
        }
    }
}
