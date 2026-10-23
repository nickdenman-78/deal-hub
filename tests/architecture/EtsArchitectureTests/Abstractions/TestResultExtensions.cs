using Shouldly;

namespace EtsArchitectureTests.Abstractions;

internal static class TestResultExtensions
{
    /// <summary>
    ///     Guards a rule whose inputs are built at runtime. A "must not depend on" rule over an empty target set
    ///     passes without checking anything, and ArchUnitNET's own empty-set check covers only the subjects.
    /// </summary>
    internal static IReadOnlyCollection<T> ShouldNotBeVacuous<T>(this IReadOnlyCollection<T> items, string what)
    {
        items.ShouldNotBeEmpty($"{what} — an empty set would make this rule assert nothing.");
        return items;
    }

    /// <summary>
    ///     Skips — visibly — a convention test whose subject does not exist yet (a module with no endpoints, no
    ///     handlers, no aggregates).
    /// </summary>
    /// <remarks>
    ///     ArchUnitNET fails a rule whose subjects are empty ("The rule requires positive evaluation"), which
    ///     is right for a rule that should always have subjects and wrong for one waiting for its first type.
    ///     Checking first and skipping keeps the first case strict and reports the second, rather than silencing
    ///     both with <c>WithoutRequiringPositiveResults()</c>.
    /// </remarks>
    internal static IReadOnlyCollection<T> SkipWhenNone<T>(this IReadOnlyCollection<T> items, string what)
    {
        Assert.SkipWhen(items.Count == 0, $"{what} — nothing to check yet.");
        return items;
    }
}
