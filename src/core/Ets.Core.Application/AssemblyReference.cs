using System.Reflection;

namespace Ets.Core.Application;

/// <summary>
///     Stable handle on this assembly for DI scanning and architecture tests.
/// </summary>
public static class AssemblyReference
{
    public static readonly Assembly Assembly = typeof(AssemblyReference).Assembly;
}
