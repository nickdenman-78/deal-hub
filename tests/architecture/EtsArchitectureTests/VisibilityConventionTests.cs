using ArchUnitNET.xUnitV3;
using EtsArchitectureTests.Abstractions;
using Microsoft.EntityFrameworkCore;
using static ArchUnitNET.Fluent.ArchRuleDefinition;
using static EtsArchitectureTests.Abstractions.EtsArchitecture;
using static EtsArchitectureTests.Abstractions.TypeQueries;

namespace EtsArchitectureTests;

/// <summary>
///     What a module keeps to itself. A type that is public can be named by the host and, through
///     <c>InternalsVisibleTo</c> mistakes or a stray reference, by anything else; one that is internal cannot.
///     Handler, validator and endpoint visibility live with their own conventions; these are the persistence
///     types.
/// </summary>
public sealed class VisibilityConventionTests
{
    public static TheoryData<string> Modules => EtsModules.Names;

    [Theory]
    [MemberData(nameof(Modules))]
    public void EntityTypeConfigurations_ShouldBe_InternalAndSealed(string moduleName)
    {
        var module = EtsModules.Named(moduleName);
        Type[] maps =
        [
            .. ConcreteClasses(module.Infrastructure)
                .Where(type => type.GetInterfaces().Any(i => i.IsGenericType &&
                                                             i.GetGenericTypeDefinition() == typeof(IEntityTypeConfiguration<>)))
        ];
        maps.SkipWhenNone($"{module.Name}.Infrastructure declares no EF Core maps");

        // Maps are discovered by namespace and instantiated by ApplyAllConfigurations; nothing names one.
        Classes().That().Are(maps)
            .Should().BeInternal()
            .Because("an EF Core map is a detail of its module's DbContext")
            .Check(Architecture);

        Classes().That().Are(maps)
            .Should().BeSealed()
            .Because("one map per entity; a hierarchy is mapped per level, not by inheriting a map")
            .Check(Architecture);
    }

    [Theory]
    [MemberData(nameof(Modules))]
    public void PersistenceRows_ShouldBe_Internal(string moduleName)
    {
        var module = EtsModules.Named(moduleName);
        Type[] rows =
        [
            .. ConcreteClasses(module.Infrastructure)
                .Where(type => type.Namespace?.EndsWith(".Persistence.Entities", StringComparison.Ordinal) == true)
        ];
        rows.SkipWhenNone($"{module.Name}.Infrastructure declares no persistence rows");

        // ADR-0010: Db* rows exist where the stored shape differs from the domain type. Only the repository
        // that maps between them should see them; persistence tests reach them through InternalsVisibleTo.
        Classes().That().Are(rows)
            .Should().BeInternal()
            .Because("persistence rows are not part of any module's contract")
            .Check(Architecture);
    }
}
