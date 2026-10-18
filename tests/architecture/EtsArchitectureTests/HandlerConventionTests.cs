using ArchUnitNET.xUnitV3;
using EtsArchitectureTests.Abstractions;
using Shouldly;
using static ArchUnitNET.Fluent.ArchRuleDefinition;
using static EtsArchitectureTests.Abstractions.EtsArchitecture;
using static EtsArchitectureTests.Abstractions.TypeQueries;

namespace EtsArchitectureTests;

/// <summary>
///     CQRS conventions (ADR-0008): handlers and validators are internal and sealed, live in the module's
///     Application, and are wrapped by the host's decorators rather than inherited from or called directly.
/// </summary>
/// <remarks>
///     Handlers are found by reflection: the handler interfaces are open generics, and matching those by name
///     is how this class of rule ends up selecting nothing. The found set is then checked with ArchUnitNET.
/// </remarks>
public sealed class HandlerConventionTests
{
    public static TheoryData<string> Modules => EtsModules.Names;

    [Theory]
    [MemberData(nameof(Modules))]
    public void Handlers_ShouldBe_Sealed(string moduleName)
    {
        var module = EtsModules.Named(moduleName);
        var handlers = Handlers(module.Application).SkipWhenNone($"{module.Name}.Application declares no handlers");

        Classes().That().Are(handlers)
            .Should().BeSealed()
            .Because("handlers are decorated, not inherited from")
            .Check(Architecture);
    }

    [Theory]
    [MemberData(nameof(Modules))]
    public void Handlers_ShouldBe_Internal(string moduleName)
    {
        var module = EtsModules.Named(moduleName);
        var handlers = Handlers(module.Application).SkipWhenNone($"{module.Name}.Application declares no handlers");

        // Endpoints and consumers inject the closed ICommandHandler<T> / IQueryHandler<,>, which is what the
        // decorators wrap. A public handler can be named and constructed directly, skipping validation and
        // logging. AddMediator scans non-public classes, so internal handlers are still registered.
        Classes().That().Are(handlers)
            .Should().BeInternal()
            .Because("callers depend on the handler interface, never on a concrete handler")
            .Check(Architecture);
    }

    [Theory]
    [MemberData(nameof(Modules))]
    public void Handlers_ShouldLive_OnlyInApplication(string moduleName)
    {
        var module = EtsModules.Named(moduleName);

        // A handler elsewhere is either missed by AddMediator (so never runs) or runs without the decorators.
        // Wolverine message handlers in Infrastructure are not kernel handlers — they translate a message and
        // call one.
        foreach (var layer in new[] {module.Domain, module.Infrastructure, module.Presentation, module.IntegrationEvents})
        {
            Handlers(layer).ShouldBeEmpty(
                $"{layer.GetName().Name} declares a CQRS handler. Use cases belong in Application.");
        }
    }

    [Theory]
    [MemberData(nameof(Modules))]
    public void Commands_ShouldHave_AtMostOneHandler(string moduleName)
    {
        var module = EtsModules.Named(moduleName);
        var handlers = Handlers(module.Application).SkipWhenNone($"{module.Name}.Application declares no handlers");

        // There is no dispatcher: an endpoint injects the closed ICommandHandler<T>. Two implementations of one
        // closed interface would silently resolve to whichever registered last.
        string[] duplicates =
        [
            .. handlers
                .SelectMany(handler => handler.GetInterfaces().Where(IsHandlerInterface))
                .GroupBy(handlerInterface => handlerInterface)
                .Where(group => group.Count() > 1)
                .Select(group => group.Key.ToString())
        ];

        duplicates.ShouldBeEmpty("Each command and query has exactly one handler.");
    }

    [Theory]
    [MemberData(nameof(Modules))]
    public void Validators_ShouldLive_OnlyInApplication(string moduleName)
    {
        var module = EtsModules.Named(moduleName);

        foreach (var layer in module.AllLayers.Where(layer => layer != module.Application))
        {
            Validators(layer).ShouldBeEmpty(
                $"{layer.GetName().Name} declares a validator. Validators shape-check commands in Application; " +
                "business rules belong to the aggregate.");
        }
    }

    [Theory]
    [MemberData(nameof(Modules))]
    public void Validators_ShouldBe_InternalAndSealed(string moduleName)
    {
        var module = EtsModules.Named(moduleName);
        var validators = Validators(module.Application)
            .SkipWhenNone($"{module.Name}.Application declares no validators");

        // Only the validation decorator uses a validator, through IValidator<T>; AddValidatorsFromAssembly is
        // called with includeInternalTypes so internal validators are registered.
        Classes().That().Are(validators)
            .Should().BeSealed()
            .Because("validators are leaves; shared rules go in a reusable rule extension, not a base class")
            .Check(Architecture);

        Classes().That().Are(validators)
            .Should().BeInternal()
            .Because("validators are resolved by the validation decorator, never referenced directly")
            .Check(Architecture);
    }
}
