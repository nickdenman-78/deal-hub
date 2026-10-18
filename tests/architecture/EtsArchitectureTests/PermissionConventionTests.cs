using System.Reflection;
using System.Text.RegularExpressions;
using EtsArchitectureTests.Abstractions;
using Shouldly;

namespace EtsArchitectureTests;

/// <summary>
///     Permission catalogue conventions (ADR-0006). Each module declares its permissions in
///     <c>{Module}.IntegrationEvents.Authorization.{Module}Permissions</c>, and the host registers one policy per
///     entry in its <c>All</c> list — so a permission missing from <c>All</c> is a policy that does not exist.
/// </summary>
public sealed partial class PermissionConventionTests
{
    public static TheoryData<string> Modules => EtsModules.Names;

    [Theory]
    [MemberData(nameof(Modules))]
    public void Module_ShouldDeclare_APermissionCatalogue(string moduleName)
    {
        var module = EtsModules.Named(moduleName);

        Catalogue(module).ShouldNotBeNull(
            $"{module.Name}.IntegrationEvents must declare {CatalogueName(module)} so the host can build its policies.");
    }

    [Theory]
    [MemberData(nameof(Modules))]
    public void EveryPermission_ShouldBe_ListedInAll(string moduleName)
    {
        var module = EtsModules.Named(moduleName);
        var catalogue = Catalogue(module).ShouldNotBeNull();

        string[] declared = DeclaredPermissions(catalogue);
        string[] all = AllPermissions(catalogue);

        declared.ShouldNotBeVacuous($"{catalogue.Name} declares no permission constants");
        declared.Except(all, StringComparer.Ordinal).ShouldBeEmpty(
            $"Every constant in {catalogue.Name} must be in {catalogue.Name}.All, or the host never registers " +
            "its policy and an endpoint asking for it can never be authorized.");
        all.Except(declared, StringComparer.Ordinal).ShouldBeEmpty(
            $"{catalogue.Name}.All must list only the catalogue's own constants.");
        all.Length.ShouldBe(all.Distinct(StringComparer.Ordinal).Count(), $"{catalogue.Name}.All has duplicates.");
    }

    [Theory]
    [MemberData(nameof(Modules))]
    public void Permissions_ShouldBe_NamespacedByModule(string moduleName)
    {
        var module = EtsModules.Named(moduleName);
        var catalogue = Catalogue(module).ShouldNotBeNull();
        string prefix = module.Name.ToLowerInvariant() + ":";

        // "deals:confirm" — the module prefix keeps permission names unique across the host, and the
        // lower-case kebab action keeps them stable as stored data in the Users module.
        AllPermissions(catalogue)
            .Where(permission => !permission.StartsWith(prefix, StringComparison.Ordinal) ||
                                 !PermissionFormat().IsMatch(permission))
            .ShouldBeEmpty($"{catalogue.Name} values must look like '{prefix}action' (lower-case, kebab-case).");
    }

    [GeneratedRegex("^[a-z][a-z0-9]*:[a-z][a-z0-9-]*$")]
    private static partial Regex PermissionFormat();

    private static string CatalogueName(EtsModule module)
    {
        return $"{module.IntegrationEventsNamespace}.Authorization.{module.Name}Permissions";
    }

    private static Type? Catalogue(EtsModule module)
    {
        return module.IntegrationEvents.GetType(CatalogueName(module));
    }

    private static string[] DeclaredPermissions(Type catalogue)
    {
        return
        [
            .. catalogue.GetFields(BindingFlags.Public | BindingFlags.Static)
                .Where(field => field is {IsLiteral: true, IsInitOnly: false} && field.FieldType == typeof(string))
                .Select(field => (string)field.GetRawConstantValue()!)
        ];
    }

    private static string[] AllPermissions(Type catalogue)
    {
        var all = catalogue.GetProperty("All", BindingFlags.Public | BindingFlags.Static);
        all.ShouldNotBeNull($"{catalogue.Name} must expose a static All list.");

        var values = all.GetValue(null).ShouldBeAssignableTo<IEnumerable<string>>();
        return [.. values!];
    }
}
