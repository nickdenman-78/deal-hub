using System.Reflection;

namespace Ets.Core.Domain;

public static class TypeExtensions
{
    /// <summary>
    ///     Gets a list of all derived types with a given base type in the list of assemblies.
    /// </summary>
    /// <param name="baseType">The base type to search for.</param>
    /// <param name="assemblies">The assemblies to search in.</param>
    /// <returns>A list of derived types.</returns>
    [UsedImplicitly]
    public static IReadOnlyList<Type> GetDerivedTypes(this Type baseType, IEnumerable<Assembly> assemblies)
    {
        ArgumentNullException.ThrowIfNull(baseType);
        ArgumentNullException.ThrowIfNull(assemblies);

        return baseType.GetDerivedTypes([.. assemblies]);
    }

    /// <summary>
    ///     Gets a list of all derived types with a given base type in the list of assemblies.
    /// </summary>
    /// <param name="baseType">The base type to search for.</param>
    /// <param name="assemblies">The assemblies to search in.</param>
    /// <returns>A list of derived types.</returns>
    [UsedImplicitly]
    public static IReadOnlyList<Type> GetDerivedTypes(this Type baseType, params Assembly[] assemblies)
    {
        ArgumentNullException.ThrowIfNull(baseType);
        ArgumentNullException.ThrowIfNull(assemblies);

        if (assemblies.Length == 0)
        {
            return [];
        }

        var result = new List<Type>(64);
        bool baseIsInterface = baseType.GetTypeInfo().IsInterface;

        foreach (var assembly in assemblies)
        {
            ArgumentNullException.ThrowIfNull(assembly);
            IEnumerable<TypeInfo> typeInfos;

            try
            {
                typeInfos = assembly.DefinedTypes;
            }
            catch (ReflectionTypeLoadException e)
            {
                typeInfos = e.Types.Where(t => t != null).Select(t => t!.GetTypeInfo());
            }

            foreach (var ti in typeInfos)
            {
                // skip abstract, generic type definitions
                if (ti.IsAbstract || ti.ContainsGenericParameters)
                {
                    continue;
                }

                if (baseIsInterface)
                {
                    if (!baseType.IsAssignableFrom(ti.AsType()))
                    {
                        continue;
                    }

                    result.Add(ti.AsType());
                    continue;
                }

                if (ti.AsType() == baseType || !baseType.IsAssignableFrom(ti.AsType()))
                {
                    continue;
                }

                result.Add(ti.AsType());
            }
        }

        return result;
    }
}
