using System.Reflection;
using Ets.Core.Domain.CQRS;
using Ets.Core.Presentation.Endpoints;
using FluentValidation;

namespace EtsArchitectureTests.Abstractions;

/// <summary>
///     Reflection queries the convention tests share.
/// </summary>
/// <remarks>
///     Subjects whose selection depends on an open generic interface (handlers) or on relating two types are
///     found here by reflection and handed to ArchUnitNET with <c>Are(types)</c>. Reflection is exact about
///     open generics; a name-based selection that misses them selects nothing.
/// </remarks>
internal static class TypeQueries
{
    internal static Type[] ConcreteClasses(Assembly assembly)
    {
        return [.. assembly.GetTypes().Where(type => type is {IsClass: true, IsAbstract: false})];
    }

    internal static Type[] Commands(Assembly assembly)
    {
        return [.. assembly.GetTypes().Where(IsCommand)];
    }

    internal static Type[] Queries(Assembly assembly)
    {
        return [.. assembly.GetTypes().Where(IsQuery)];
    }

    internal static Type[] Handlers(Assembly assembly)
    {
        return [.. ConcreteClasses(assembly).Where(type => type.GetInterfaces().Any(IsHandlerInterface))];
    }

    internal static Type[] Validators(Assembly assembly)
    {
        return [.. ConcreteClasses(assembly).Where(type => typeof(IValidator).IsAssignableFrom(type))];
    }

    internal static Type[] Endpoints(Assembly assembly)
    {
        return [.. ConcreteClasses(assembly).Where(type => typeof(IEndpoint).IsAssignableFrom(type))];
    }

    /// <summary>The command or query a handler handles: the first argument of its handler interface.</summary>
    internal static Type HandledRequest(Type handler)
    {
        return handler.GetInterfaces().First(IsHandlerInterface).GetGenericArguments()[0];
    }

    /// <summary>The type an <c>AbstractValidator&lt;T&gt;</c> validates, or <see langword="null" />.</summary>
    internal static Type? ValidatedType(Type validator)
    {
        for (var current = validator.BaseType; current is not null; current = current.BaseType)
        {
            if (current.IsGenericType && current.GetGenericTypeDefinition() == typeof(AbstractValidator<>))
            {
                return current.GetGenericArguments()[0];
            }
        }

        return null;
    }

    internal static bool IsHandlerInterface(Type candidate)
    {
        if (!candidate.IsGenericType)
        {
            return false;
        }

        var definition = candidate.GetGenericTypeDefinition();

        return definition == typeof(IQueryHandler<,>) ||
               definition == typeof(ICommandHandler<>) ||
               definition == typeof(ICommandHandler<,>);
    }

    /// <summary>
    ///     The namespace segment immediately below <paramref name="root" />, two levels deep — the use-case
    ///     slices <c>{Layer}.{Aggregate}s.{UseCase}</c> — that types in <paramref name="assembly" /> occupy.
    /// </summary>
    internal static string[] Slices(Assembly assembly, string root)
    {
        return
        [
            .. assembly.GetTypes()
                .Select(type => type.Namespace)
                .OfType<string>()
                .Where(ns => ns.StartsWith(root + ".", StringComparison.Ordinal))
                .Select(ns => ns[(root.Length + 1)..].Split('.'))
                .Where(segments => segments.Length >= 2)
                .Select(segments => $"{root}.{segments[0]}.{segments[1]}")
                .Distinct(StringComparer.Ordinal)
                .Order(StringComparer.Ordinal)
        ];
    }

    private static bool IsCommand(Type type)
    {
        return type is {IsClass: true, IsAbstract: false} &&
               (typeof(ICommand).IsAssignableFrom(type) ||
                type.GetInterfaces().Any(i => i.IsGenericType && i.GetGenericTypeDefinition() == typeof(ICommand<>)));
    }

    private static bool IsQuery(Type type)
    {
        return type is {IsClass: true, IsAbstract: false} &&
               type.GetInterfaces().Any(i => i.IsGenericType && i.GetGenericTypeDefinition() == typeof(IQuery<>));
    }
}
