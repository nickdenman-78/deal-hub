using System.Reflection;
using System.Runtime.CompilerServices;
using Ets.Core.Domain.Events;
using Ets.Core.Domain.Models;
using EtsArchitectureTests.Abstractions;
using Shouldly;

namespace EtsArchitectureTests;

/// <summary>
///     Tactical DDD conventions for module domains: the persistence model each module chose (ADR-0013),
///     immutable events, and aggregates that guard their own state.
/// </summary>
public sealed class DomainConventionTests
{
    public static TheoryData<string> Modules => EtsModules.Names;

    [Theory]
    [MemberData(nameof(Modules))]
    public void AggregateRoots_ShouldUse_TheModulesPersistenceModel(string moduleName)
    {
        var module = EtsModules.Named(moduleName);
        var roots = AggregateRoots(module.Domain).SkipWhenNone($"{module.Name}.Domain declares no aggregate roots");

        var expectedBase = module.IsEventSourced ? typeof(EventSourcedAggregate<>) : typeof(AggregateRoot<>);

        // A module never mixes both models for one aggregate, and Deals and Settlement are event sourced so
        // the stream is the audit trail.
        roots
            .Where(root => !DerivesFromGeneric(root, expectedBase))
            .Select(root => root.FullName)
            .ShouldBeEmpty(
                $"{module.Name} is {(module.IsEventSourced ? "event sourced" : "state based")}: every aggregate " +
                $"root must derive from {expectedBase.Name.Split('`')[0]}<TId>.");
    }

    [Theory]
    [MemberData(nameof(Modules))]
    public void Entities_ShouldNotHave_PublicSetters(string moduleName)
    {
        var module = EtsModules.Named(moduleName);
        var entities = DomainTypes(module.Domain)
            .Where(type => typeof(IEntity).IsAssignableFrom(type))
            .ToArray()
            .SkipWhenNone($"{module.Name}.Domain declares no entities");

        // State changes go through the root's behaviour methods. A public setter is an invariant anyone can
        // bypass.
        entities
            .SelectMany(entity => entity.GetProperties(BindingFlags.Instance | BindingFlags.Public)
                .Where(property => property.SetMethod is {IsPublic: true})
                .Select(property => $"{entity.Name}.{property.Name}"))
            .ShouldBeEmpty("Entities expose state read-only; behaviour methods change it.");
    }

    [Theory]
    [MemberData(nameof(Modules))]
    public void Entities_ShouldNotHave_PublicConstructors(string moduleName)
    {
        var module = EtsModules.Named(moduleName);
        var entities = DomainTypes(module.Domain)
            .Where(type => typeof(IEntity).IsAssignableFrom(type))
            .ToArray()
            .SkipWhenNone($"{module.Name}.Domain declares no entities");

        // Entities are created through a static factory (Deal.Capture, Position.Open) that validates, assigns
        // the Guid v7 id and raises the creation event. A public constructor is a way round all three.
        entities
            .Where(entity => entity.GetConstructors(BindingFlags.Instance | BindingFlags.Public).Length > 0)
            .Select(entity => entity.FullName)
            .ShouldBeEmpty("Entities have no public constructors; use a static factory method.");
    }

    [Theory]
    [MemberData(nameof(Modules))]
    public void DomainEvents_ShouldBe_SealedAndImmutable(string moduleName)
    {
        var module = EtsModules.Named(moduleName);
        var events = DomainTypes(module.Domain)
            .Where(type => typeof(IDomainEvent).IsAssignableFrom(type))
            .ToArray()
            .SkipWhenNone($"{module.Name}.Domain declares no domain events");

        events
            .Where(domainEvent => !domainEvent.IsSealed)
            .Select(domainEvent => domainEvent.Name)
            .ShouldBeEmpty("Domain events are sealed records: a released event type is never extended or changed.");

        // Records give init-only setters, which are fine. Anything settable after construction is not: a
        // persisted stream event that can be mutated in memory no longer matches what was stored.
        events
            .SelectMany(domainEvent => domainEvent.GetProperties(BindingFlags.Instance | BindingFlags.Public)
                .Where(property => property.SetMethod is {IsPublic: true} setter && !IsInitOnly(setter))
                .Select(property => $"{domainEvent.Name}.{property.Name}"))
            .ShouldBeEmpty("Domain events are immutable.");
    }

    [Theory]
    [MemberData(nameof(Modules))]
    public void DomainEvents_ShouldLive_OnlyInDomain(string moduleName)
    {
        var module = EtsModules.Named(moduleName);

        // Domain events are internal to the module. What crosses the boundary is an integration event in
        // IntegrationEvents, mapped explicitly by the unit of work.
        foreach (var layer in module.AllLayers.Where(layer => layer != module.Domain))
        {
            DomainTypes(layer)
                .Where(type => typeof(IDomainEvent).IsAssignableFrom(type))
                .Select(type => type.Name)
                .ShouldBeEmpty($"{layer.GetName().Name} declares a domain event; they belong in Domain.");
        }
    }

    private static Type[] DomainTypes(Assembly assembly)
    {
        return [.. assembly.GetTypes().Where(type => type is {IsClass: true, IsAbstract: false})];
    }

    private static Type[] AggregateRoots(Assembly assembly)
    {
        return [.. DomainTypes(assembly).Where(type => typeof(IAggregateRoot).IsAssignableFrom(type))];
    }

    private static bool DerivesFromGeneric(Type type, Type openGenericBase)
    {
        for (var current = type.BaseType; current is not null; current = current.BaseType)
        {
            if (current.IsGenericType && current.GetGenericTypeDefinition() == openGenericBase)
            {
                return true;
            }
        }

        return false;
    }

    private static bool IsInitOnly(MethodInfo setter)
    {
        return setter.ReturnParameter.GetRequiredCustomModifiers().Contains(typeof(IsExternalInit));
    }
}
