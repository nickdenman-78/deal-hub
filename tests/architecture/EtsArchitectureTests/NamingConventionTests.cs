using System.Reflection;
using System.Text.RegularExpressions;
using Ets.Core.Domain.Events;
using EtsArchitectureTests.Abstractions;
using Microsoft.EntityFrameworkCore;
using Shouldly;
using static EtsArchitectureTests.Abstractions.TypeQueries;

namespace EtsArchitectureTests;

/// <summary>
///     Naming and placement conventions from <c>CLAUDE.md</c>, the ADRs and the <c>ddd</c> skill. A name says
///     what a type is and where to find it; these turn the review comments that keep that true into rules.
/// </summary>
/// <remarks>
///     Rules about a kind of type that does not exist yet are skipped, not passed — see
///     <c>TestResultExtensions.SkipWhenNone</c>.
/// </remarks>
public sealed partial class NamingConventionTests
{
    public static TheoryData<string> Modules => EtsModules.Names;

    // ---- Projects and composition roots -------------------------------------------------------------------

    [Theory]
    [MemberData(nameof(Modules))]
    public void LayerNamespaces_ShouldFollow_TheModuleConvention(string moduleName)
    {
        var module = EtsModules.Named(moduleName);

        // The namespaces the other rules use are read from AssemblyReference; this pins them to the
        // convention the planned-module rules assume (Ets.Modules.{Module}.{Layer}).
        module.DomainNamespace.ShouldBe($"{module.Namespace}.Domain");
        module.ApplicationNamespace.ShouldBe($"{module.Namespace}.Application");
        module.InfrastructureNamespace.ShouldBe($"{module.Namespace}.Infrastructure");
        module.IntegrationEventsNamespace.ShouldBe($"{module.Namespace}.IntegrationEvents");
        module.PresentationNamespace.ShouldBe($"{module.Namespace}.Presentation");
    }

    [Theory]
    [MemberData(nameof(Modules))]
    public void Module_ShouldExpose_ItsThreeCompositionMethods(string moduleName)
    {
        var module = EtsModules.Named(moduleName);

        // ADR-0003: three lines per module in Program.cs.
        var serviceRoot = module.Infrastructure.GetType($"{module.InfrastructureNamespace}.{module.Name}Module");
        serviceRoot.ShouldNotBeNull($"{module.Name}.Infrastructure must declare {module.Name}Module.");
        HasPublicStaticMethod(serviceRoot, $"Add{module.Name}Module")
            .ShouldBeTrue($"{module.Name}Module must expose Add{module.Name}Module(services, configuration).");

        var routeRoot = module.Presentation.GetType($"{module.PresentationNamespace}.{module.Name}Endpoints");
        routeRoot.ShouldNotBeNull($"{module.Name}.Presentation must declare {module.Name}Endpoints.");
        HasPublicStaticMethod(routeRoot, $"Add{module.Name}Endpoints")
            .ShouldBeTrue($"{module.Name}Endpoints must expose Add{module.Name}Endpoints(services, policies).");
        HasPublicStaticMethod(routeRoot, $"Map{module.Name}Module")
            .ShouldBeTrue($"{module.Name}Endpoints must expose Map{module.Name}Module(app).");

        module.Presentation.GetType($"{module.PresentationNamespace}.{module.Name}AuthorizationPolicies")
            .ShouldNotBeNull($"{module.Name}.Presentation must declare {module.Name}AuthorizationPolicies.");
        module.Presentation.GetType($"{module.PresentationNamespace}.OpenApiDocuments")
            .ShouldNotBeNull($"{module.Name}.Presentation must declare its OpenApiDocuments.");
    }

    // ---- Commands, queries, handlers, validators ----------------------------------------------------------

    [Theory]
    [MemberData(nameof(Modules))]
    public void Commands_ShouldEndWith_Command(string moduleName)
    {
        var module = EtsModules.Named(moduleName);
        var commands = Commands(module.Application).SkipWhenNone($"{module.Name}.Application declares no commands");

        commands
            .Where(command => !command.Name.EndsWith("Command", StringComparison.Ordinal))
            .Select(command => command.FullName)
            .ShouldBeEmpty("Commands are named {UseCase}Command.");
    }

    [Theory]
    [MemberData(nameof(Modules))]
    public void Queries_ShouldEndWith_Query(string moduleName)
    {
        var module = EtsModules.Named(moduleName);
        var queries = Queries(module.Application).SkipWhenNone($"{module.Name}.Application declares no queries");

        queries
            .Where(query => !query.Name.EndsWith("Query", StringComparison.Ordinal))
            .Select(query => query.FullName)
            .ShouldBeEmpty("Queries are named {UseCase}Query.");
    }

    [Theory]
    [MemberData(nameof(Modules))]
    public void Commands_AndQueries_ShouldLive_OnlyInApplication(string moduleName)
    {
        var module = EtsModules.Named(moduleName);

        // An endpoint builds the command from its request DTO; the command itself belongs to the use case.
        foreach (var layer in module.AllLayers.Where(layer => layer != module.Application))
        {
            Commands(layer).Concat(Queries(layer))
                .Select(type => type.FullName)
                .ShouldBeEmpty($"{layer.GetName().Name} declares a command or query; they belong in Application.");
        }
    }

    [Theory]
    [MemberData(nameof(Modules))]
    public void Handlers_ShouldBeNamed_AfterTheirRequest(string moduleName)
    {
        var module = EtsModules.Named(moduleName);
        var handlers = Handlers(module.Application).SkipWhenNone($"{module.Name}.Application declares no handlers");

        // ConfirmDealCommand → ConfirmDealCommandHandler; GetDealQuery → GetDealQueryHandler.
        handlers
            .Where(handler => handler.Name != HandledRequest(handler).Name + "Handler")
            .Select(handler => $"{handler.Name} handles {HandledRequest(handler).Name}")
            .ShouldBeEmpty("A handler is named {Request}Handler, so {UseCase}CommandHandler or {UseCase}QueryHandler.");
    }

    [Theory]
    [MemberData(nameof(Modules))]
    public void Handlers_ShouldLive_BesideTheirRequest(string moduleName)
    {
        var module = EtsModules.Named(moduleName);
        var handlers = Handlers(module.Application).SkipWhenNone($"{module.Name}.Application declares no handlers");

        // The use-case folder holds the command, its handler and its validator together.
        handlers
            .Where(handler => handler.Namespace != HandledRequest(handler).Namespace)
            .Select(handler => $"{handler.FullName} is not in {HandledRequest(handler).Namespace}")
            .ShouldBeEmpty("A handler lives in its request's use-case folder.");
    }

    [Theory]
    [MemberData(nameof(Modules))]
    public void Validators_ShouldBeNamed_AfterWhatTheyValidate(string moduleName)
    {
        var module = EtsModules.Named(moduleName);
        var validators = Validators(module.Application)
            .SkipWhenNone($"{module.Name}.Application declares no validators");

        // ConfirmDealCommand → ConfirmDealCommandValidator, in the same folder.
        validators
            .Select(validator => (Validator: validator, Target: ValidatedType(validator)))
            .Where(pair => pair.Target is null ||
                           pair.Validator.Name != pair.Target.Name + "Validator" ||
                           pair.Validator.Namespace != pair.Target.Namespace)
            .Select(pair => pair.Validator.FullName)
            .ShouldBeEmpty("A validator derives from AbstractValidator<T>, is named {T}Validator and lives beside T.");
    }

    // ---- Domain --------------------------------------------------------------------------------------------

    [Theory]
    [MemberData(nameof(Modules))]
    public void DomainEvents_ShouldBe_PastTenseWithoutAnEventSuffix(string moduleName)
    {
        var module = EtsModules.Named(moduleName);
        var events = DomainEvents(module).SkipWhenNone($"{module.Name}.Domain declares no domain events");

        // DealConfirmed, not DealConfirmedEvent or ConfirmDealEvent. The suffix check is mechanical; past
        // tense itself is a review call, so this catches the common way it goes wrong.
        events
            .Where(domainEvent => domainEvent.Name.EndsWith("Event", StringComparison.Ordinal) ||
                                  domainEvent.Name.EndsWith("DomainEvent", StringComparison.Ordinal))
            .Select(domainEvent => domainEvent.Name)
            .ShouldBeEmpty("Domain events are named for what happened (DealConfirmed), without an Event suffix.");
    }

    [Theory]
    [MemberData(nameof(Modules))]
    public void DomainEvents_ShouldLive_InTheEventsNamespace(string moduleName)
    {
        var module = EtsModules.Named(moduleName);
        var events = DomainEvents(module).SkipWhenNone($"{module.Name}.Domain declares no domain events");
        string expected = $"{module.DomainNamespace}.Events";

        events
            .Where(domainEvent => domainEvent.Namespace != expected)
            .Select(domainEvent => domainEvent.FullName)
            .ShouldBeEmpty($"Domain events live in {expected}.");
    }

    [Theory]
    [MemberData(nameof(Modules))]
    public void RepositoryPorts_ShouldLive_InDomainRepositories(string moduleName)
    {
        var module = EtsModules.Named(moduleName);
        string expected = $"{module.DomainNamespace}.Repositories";

        var ports = module.AllLayers
            .SelectMany(layer => layer.GetTypes())
            .Where(type => type.IsInterface && type.Name.EndsWith("Repository", StringComparison.Ordinal))
            .ToArray()
            .SkipWhenNone($"{module.Name} declares no repository ports");

        ports
            .Where(port => port.Namespace != expected)
            .Select(port => port.FullName)
            .ShouldBeEmpty($"Repository ports (I{{Aggregate}}Repository) are declared in {expected}.");
    }

    // ---- Infrastructure ------------------------------------------------------------------------------------

    [Theory]
    [MemberData(nameof(Modules))]
    public void EntityTypeConfigurations_ShouldBeNamed_MapAndLiveInPersistenceConfiguration(string moduleName)
    {
        var module = EtsModules.Named(moduleName);
        var maps = ConcreteClasses(module.Infrastructure)
            .Where(type => type.GetInterfaces().Any(i => i.IsGenericType &&
                                                         i.GetGenericTypeDefinition() == typeof(IEntityTypeConfiguration<>)))
            .ToArray()
            .SkipWhenNone($"{module.Name}.Infrastructure declares no EF Core maps");

        // ADR-0010: one IEntityTypeConfiguration per entity, named {Entity}Map, under the context's
        // Persistence/Configuration — ApplyAllConfigurations discovers them by namespace.
        maps
            .Where(map => !map.Name.EndsWith("Map", StringComparison.Ordinal) ||
                          map.Namespace?.EndsWith(".Persistence.Configuration", StringComparison.Ordinal) != true)
            .Select(map => map.FullName)
            .ShouldBeEmpty("EF Core maps are named {Entity}Map and live in a Persistence.Configuration namespace.");
    }

    [Theory]
    [MemberData(nameof(Modules))]
    public void PersistenceRows_ShouldBePrefixed_Db(string moduleName)
    {
        var module = EtsModules.Named(moduleName);
        var rows = ConcreteClasses(module.Infrastructure)
            .Where(type => type.Namespace?.EndsWith(".Persistence.Entities", StringComparison.Ordinal) == true)
            .ToArray()
            .SkipWhenNone($"{module.Name}.Infrastructure declares no persistence rows");

        // ADR-0010: Db + entity name, singular (DbTrade). Domain types never take the prefix.
        rows
            .Where(row => !DbRowName().IsMatch(row.Name))
            .Select(row => row.FullName)
            .ShouldBeEmpty("Persistence rows are named Db{Entity}.");
    }

    [Theory]
    [MemberData(nameof(Modules))]
    public void DomainTypes_ShouldNotBePrefixed_Db(string moduleName)
    {
        var module = EtsModules.Named(moduleName);

        module.Domain.GetTypes()
            .Where(type => DbRowName().IsMatch(type.Name))
            .Select(type => type.FullName)
            .ShouldBeEmpty("The Db prefix marks persistence rows; a domain type never carries it.");
    }

    [Theory]
    [MemberData(nameof(Modules))]
    public void MessageConsumers_ShouldLive_InInfrastructureMessaging(string moduleName)
    {
        var module = EtsModules.Named(moduleName);
        string expected = $"{module.InfrastructureNamespace}.Messaging";

        var consumers = module.AllLayers
            .SelectMany(ConcreteClasses)
            .Where(type => type.Name.EndsWith("Consumer", StringComparison.Ordinal))
            .ToArray()
            .SkipWhenNone($"{module.Name} declares no message consumers");

        // ADR-0011: consumers are Wolverine handlers in the consuming module's Infrastructure — an inbound
        // adapter, named {IntegrationEvent}Consumer.
        consumers
            .Where(consumer => consumer.Namespace?.StartsWith(expected, StringComparison.Ordinal) != true)
            .Select(consumer => consumer.FullName)
            .ShouldBeEmpty($"Message consumers live in {expected}.");
    }

    [Fact]
    public void OptionsClasses_ShouldDeclare_ASectionName()
    {
        var options = CoreAssemblies.All
            .Concat(EtsModules.All.SelectMany(module => module.AllLayers))
            .SelectMany(ConcreteClasses)
            .Where(type => type.Name.EndsWith("Options", StringComparison.Ordinal))
            .ToArray();
        options.ShouldNotBeVacuous("no *Options classes were found");

        // ADR-0005: the section constant is the contract — Bind, validation messages and errors all name it.
        options
            .Where(type => type.GetField("SectionName", BindingFlags.Public | BindingFlags.Static) is not
                               {IsLiteral: true} field ||
                           field.FieldType != typeof(string))
            .Select(type => type.FullName)
            .ShouldBeEmpty("Every *Options class declares public const string SectionName.");
    }

    // ---- Public API and presentation -----------------------------------------------------------------------

    [Theory]
    [MemberData(nameof(Modules))]
    public void IntegrationEvents_ShouldBe_VersionedAndSealed(string moduleName)
    {
        var module = EtsModules.Named(moduleName);
        string eventsNamespace = $"{module.IntegrationEventsNamespace}.Events";

        var events = ConcreteClasses(module.IntegrationEvents)
            .Where(type => type.Namespace == eventsNamespace)
            .ToArray()
            .SkipWhenNone($"{module.Name}.IntegrationEvents declares no integration events");

        // ADR-0011: published contracts are versioned by name (DealConfirmedV1); a new shape is a new type,
        // never a change to a released one.
        events
            .Where(integrationEvent => !VersionedName().IsMatch(integrationEvent.Name) || !integrationEvent.IsSealed)
            .Select(integrationEvent => integrationEvent.FullName)
            .ShouldBeEmpty("Integration events are sealed and named {Fact}V{n}, e.g. DealConfirmedV1.");
    }

    [Theory]
    [MemberData(nameof(Modules))]
    public void Endpoints_ShouldMirror_AnApplicationUseCase(string moduleName)
    {
        var module = EtsModules.Named(moduleName);
        var endpoints = Endpoints(module.Presentation)
            .SkipWhenNone($"{module.Name}.Presentation declares no endpoints");

        string[] useCases =
        [
            .. module.Application.GetTypes()
                .Select(type => type.Namespace)
                .OfType<string>()
                .Distinct(StringComparer.Ordinal)
        ];

        // Presentation/{Aggregate}s/{UseCase}.cs mirrors Application/{Aggregate}s/{UseCase}/, so the
        // endpoint for ConfirmDeal is found where the ConfirmDeal use case is (architecture.md).
        endpoints
            .Where(endpoint => endpoint.Name.EndsWith("Endpoint", StringComparison.Ordinal) ||
                               !useCases.Contains(MirroredUseCase(module, endpoint), StringComparer.Ordinal))
            .Select(endpoint => $"{endpoint.FullName} (expected use case {MirroredUseCase(module, endpoint)})")
            .ShouldBeEmpty(
                "An endpoint is named for its use case, without an Endpoint suffix, and sits in the folder that " +
                "mirrors the use case's Application folder.");
    }

    [GeneratedRegex("^Db[A-Z][A-Za-z0-9]*$")]
    private static partial Regex DbRowName();

    [GeneratedRegex("^[A-Z][A-Za-z0-9]*[a-z]V[0-9]+$")]
    private static partial Regex VersionedName();

    private static Type[] DomainEvents(EtsModule module)
    {
        return [.. ConcreteClasses(module.Domain).Where(type => typeof(IDomainEvent).IsAssignableFrom(type))];
    }

    private static bool HasPublicStaticMethod(Type type, string name)
    {
        return type.GetMethods(BindingFlags.Public | BindingFlags.Static).Any(method => method.Name == name);
    }

    /// <summary>
    ///     <c>Ets.Modules.Deals.Presentation.Deals.ConfirmDeal</c> →
    ///     <c>Ets.Modules.Deals.Application.Deals.ConfirmDeal</c>.
    /// </summary>
    private static string MirroredUseCase(EtsModule module, Type endpoint)
    {
        string relative = endpoint.Namespace is { } ns && ns.Length > module.PresentationNamespace.Length
            ? ns[module.PresentationNamespace.Length..]
            : string.Empty;

        return $"{module.ApplicationNamespace}{relative}.{endpoint.Name}";
    }
}
