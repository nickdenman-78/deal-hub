using System.Reflection;
using ArchUnitNET.xUnitV3;
using EtsArchitectureTests.Abstractions;
using static ArchUnitNET.Fluent.ArchRuleDefinition;
using static EtsArchitectureTests.Abstractions.EtsArchitecture;

namespace EtsArchitectureTests;

/// <summary>
///     Vertical slices do not depend on each other. Each use case — <c>Application/{Aggregate}s/{UseCase}/</c>
///     and its endpoint in <c>Presentation/{Aggregate}s/</c> — can be read, changed and deleted on its own. What
///     two slices share belongs one level up (the aggregate folder, a port) or in the domain.
/// </summary>
/// <remarks>
///     Forbidding every dependency between slices also rules out cycles between them. Slices are found from
///     the types that exist, so a new use case is covered the moment it is added.
/// </remarks>
public sealed class SliceIndependenceTests
{
    public static TheoryData<string> Modules => EtsModules.Names;

    [Theory]
    [MemberData(nameof(Modules))]
    public void ApplicationSlices_ShouldNotDependOn_EachOther(string moduleName)
    {
        var module = EtsModules.Named(moduleName);

        AssertSlicesIndependent(module.Application, module.ApplicationNamespace, $"{module.Name}.Application");
    }

    [Theory]
    [MemberData(nameof(Modules))]
    public void PresentationSlices_ShouldNotDependOn_EachOther(string moduleName)
    {
        var module = EtsModules.Named(moduleName);

        AssertSlicesIndependent(module.Presentation, module.PresentationNamespace, $"{module.Name}.Presentation");
    }

    private static void AssertSlicesIndependent(Assembly assembly, string root, string layerName)
    {
        string[] slices = TypeQueries.Slices(assembly, root);

        // One slice has nothing to be independent of.
        Assert.SkipWhen(slices.Length < 2, $"{layerName} has fewer than two use-case slices — nothing to check yet.");

        foreach (string slice in slices)
        {
            string[] others = [.. slices.Where(other => other != slice)];

            Types().That().ResideInNamespaceMatching(NamespaceTreePattern(slice))
                .Should().NotDependOnAny(TypesInNamespaces(others))
                .Because($"{slice} must not depend on another use case; move what they share up to the " +
                         "aggregate folder or into the domain")
                .Check(Architecture);
        }
    }
}
