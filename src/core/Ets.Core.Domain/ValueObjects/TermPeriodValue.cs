// Licensed to the.NET Foundation under one or more agreements.
// The.NET Foundation licenses this file to you under the MIT license.

namespace Ets.Core.Domain.ValueObjects;

[Flags]
public enum TermPeriodValue
{
    [UsedImplicitly] None = 0,
    [UsedImplicitly] Months = 1,
    [UsedImplicitly] Quarters = 2,
    [UsedImplicitly] HalfYears = 4,
    [UsedImplicitly] FinYears = 8,
    [UsedImplicitly] CalYears = 16,
    [UsedImplicitly] All = Months | Quarters | HalfYears | FinYears | CalYears,
    [UsedImplicitly] AllButMonths = Quarters | HalfYears | FinYears | CalYears,
    [UsedImplicitly] FullYears = FinYears | CalYears
}
