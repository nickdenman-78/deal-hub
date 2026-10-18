using System.Reflection;

namespace EtsArchitectureTests.Abstractions;

/// <summary>
///     The shared kernel's layer assemblies (<c>src/core</c>).
/// </summary>
internal static class CoreAssemblies
{
    internal const string DomainNamespace = "Ets.Core.Domain";
    internal const string ApplicationNamespace = "Ets.Core.Application";
    internal const string InfrastructureNamespace = "Ets.Core.Infrastructure";
    internal const string PresentationNamespace = "Ets.Core.Presentation";

    internal static readonly Assembly Domain = Ets.Core.Domain.AssemblyReference.Assembly;
    internal static readonly Assembly Application = Ets.Core.Application.AssemblyReference.Assembly;
    internal static readonly Assembly Infrastructure = Ets.Core.Infrastructure.AssemblyReference.Assembly;
    internal static readonly Assembly Presentation = Ets.Core.Presentation.AssemblyReference.Assembly;

    internal static IReadOnlyList<Assembly> All => [Domain, Application, Infrastructure, Presentation];
}
