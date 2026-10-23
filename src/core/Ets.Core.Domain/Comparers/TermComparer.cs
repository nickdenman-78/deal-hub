// Licensed to the.NET Foundation under one or more agreements.
// The.NET Foundation licenses this file to you under the MIT license.

using Ets.Core.Domain.ValueObjects;

namespace Ets.Core.Domain.Comparers;

public interface ITermComparable<in T>
{
    [UsedImplicitly]
    int Compare(T term1, T term2);
}

public sealed class TermComparer : IComparer<Term>, IComparer<string>, ITermComparable<Term>
{
    [UsedImplicitly]
    public int Compare(string? termStr1, string? termStr2)
    {
        if (string.IsNullOrWhiteSpace(termStr1) && string.IsNullOrWhiteSpace(termStr2))
        {
            return string.Compare(termStr1, termStr2, StringComparison.OrdinalIgnoreCase);
        }

        var term1 = Term.Create(termStr1!);
        var term2 = Term.Create(termStr2!);

        return Compare(term1, term2);
    }

    [UsedImplicitly]
    public int Compare(Term? term1, Term? term2)
    {
        if (term1 is null && term2 is null)
        {
            return 0;
        }

        if (term2 is null)
        {
            return 1;
        }

        if (term1 is null)
        {
            return -1;
        }

        if (term1.StartDate == term2.StartDate && term1.EndDate == term2.EndDate)
        {
            return 0;
        }

        return CompareTerms(term1, term2);
    }

    private static int CompareTerms(Term term1, Term term2)
    {
        var terms = new List<Term> {term1, term2}
            .OrderBy(GenerateSortableKey)
            .ThenBy(term => term.Name)
            .ToList();

        return ReferenceEquals(terms[0], term1) ? -1 : 1;
    }

    private static int GenerateSortableKey(Term term)
    {
        // use number instead of string to speed up comparison
        return term.Span.SortOrder * 100_000_000 + // e.g. Month -> 1 * 1_000_000 = 1_000_000 
               (term.StartDate.Year - 2_000) * 1_000_000 + // e.g. 2022 -> 22 * 10_000_000 = 220_000_000
               term.StartDate.Month * 10_000 + // e.g. January -> 1 * 10_000 = 10_000
               (term.EndDate.Year - 2_000) * 100 + // e.g. 2022 -> 22 * 100 = 2_200
               term.EndDate.Month; // e.g. January -> 1 = 1
    }
}
