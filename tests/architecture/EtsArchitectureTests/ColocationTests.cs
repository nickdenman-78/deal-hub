using EtsArchitectureTests.Abstractions;
using Shouldly;
using static EtsArchitectureTests.Abstractions.TypeQueries;

namespace EtsArchitectureTests;

/// <summary>
///     A use case lives in one folder: <c>Application/{Aggregate}s/{UseCase}/</c> holds the command or query,
///     its handler, its validator and its response. Searching for a use case finds all of it in one place.
/// </summary>
/// <remarks>
///     ArchUnitNET cannot relate one type's namespace to another's, so these are reflection checks.
///     <c>NamingConventionTests</c> already pins handlers and validators beside their request; this adds the
///     response types.
/// </remarks>
public sealed class ColocationTests
{
    public static TheoryData<string> Modules => EtsModules.Names;

    [Theory]
    [MemberData(nameof(Modules))]
    public void Responses_ShouldLive_WithTheirRequestOrItsAggregate(string moduleName)
    {
        var module = EtsModules.Named(moduleName);
        var requests = Commands(module.Application)
            .Concat(Queries(module.Application))
            .ToArray()
            .SkipWhenNone($"{module.Name}.Application declares no commands or queries");

        // A response declared in this module (unwrapping IReadOnlyList<DealSummary> and the like) sits in the
        // request's folder, or one level up when several use cases of the same aggregate return it. A response
        // anywhere else is a shared DTO in disguise, coupling slices that should not know each other.
        string[] misplaced =
        [
            .. requests.SelectMany(request => ResponseTypes(request)
                .Where(response => response.Assembly == module.Application)
                .Where(response => response.Namespace != request.Namespace &&
                                   response.Namespace != ParentNamespace(request.Namespace))
                .Select(response => $"{response.FullName} (returned by {request.Name})"))
        ];

        misplaced.ShouldBeEmpty("Response types live in their request's use-case folder or its aggregate folder.");
    }

    private static IEnumerable<Type> ResponseTypes(Type request)
    {
        var responseInterface = request.GetInterfaces()
            .FirstOrDefault(i => i.IsGenericType &&
                                 (i.GetGenericTypeDefinition() == typeof(Ets.Core.Domain.CQRS.IQuery<>) ||
                                  i.GetGenericTypeDefinition() == typeof(Ets.Core.Domain.CQRS.ICommand<>)));

        return responseInterface is null ? [] : Flatten(responseInterface.GetGenericArguments()[0]);
    }

    private static IEnumerable<Type> Flatten(Type type)
    {
        yield return type;

        if (type.IsArray && type.GetElementType() is { } element)
        {
            foreach (var inner in Flatten(element))
            {
                yield return inner;
            }
        }

        if (!type.IsGenericType)
        {
            yield break;
        }

        foreach (var argument in type.GetGenericArguments())
        {
            foreach (var inner in Flatten(argument))
            {
                yield return inner;
            }
        }
    }

    private static string? ParentNamespace(string? ns)
    {
        int dot = ns?.LastIndexOf('.') ?? -1;
        return dot < 0 ? null : ns![..dot];
    }
}
