// Licensed to the.NET Foundation under one or more agreements.
// The.NET Foundation licenses this file to you under the MIT license.

using System.Text.RegularExpressions;

namespace Ets.Core.Domain.Specifications;

internal static partial class TermConstants
{
    private const string PatCal = @"^(?:Cal(?<calyear>\d{2}))$";
    private const string PatFin = @"^(?:Fin(?<finyearstart>\d{2})(?:(?:\/|-){0,1}(?<finyearend>\d{2})){0,1})$";
    private const string PatQtr = @"^(?:Q(?<qtr>[1-4])(?<qtryear>\d{2}))$";
    private const string PatJjd = @"^(?:(?<halfyearstart>J[JD])(?<halfyear>\d{2}))$";
    private const string TermPattern = $@"{PatCal}|{PatFin}|{PatQtr}|{PatMth}|{PatJjd}";

    private const string PatMth =
        @"^(?<monthstart>Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)(?:t*)(?<monthstartyear>\d{2})" +
        @"(?:-(?<monthend>Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)(?:t*)(?<monthendyear>\d{2})){0,1}$";


    /// <summary>
    ///     In a route parameter, '{' and '}' must be escaped with '{{' and '}}'
    /// </summary>
    [UsedImplicitly] public const string RouteTermPattern = "^(?:Cal\\d{{2}})|" +
                                                            "(?:Fin\\d{{2}}(?:\\/|-|%2F){{0,1}}\\d{{2}})|" +
                                                            "(?:Q[[1-4]]\\d{{2}})|" +
                                                            "(?:)(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)(?:t*)\\d{{2}}" +
                                                            "(?:-(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)(?:t*)\\d{{2}}){{0,1}})|" +
                                                            "(?:J[[JD]]\\d{{2}})$";

    internal static int[] QuarterStartMonths { get; } = [1, 4, 7, 10];

    [GeneratedRegex(PatMth, RegexOptions.IgnoreCase | RegexOptions.Compiled | RegexOptions.Singleline, "en-AU")]
    internal static partial Regex MonthRegexPattern();

    [GeneratedRegex(PatQtr, RegexOptions.IgnoreCase | RegexOptions.Compiled | RegexOptions.Singleline, "en-AU")]
    internal static partial Regex QuarterRegexPattern();

    [GeneratedRegex(PatFin, RegexOptions.IgnoreCase | RegexOptions.Compiled | RegexOptions.Singleline, "en-AU")]
    internal static partial Regex FinYearRegexPattern();

    [GeneratedRegex(PatCal, RegexOptions.IgnoreCase | RegexOptions.Compiled | RegexOptions.Singleline, "en-AU")]
    internal static partial Regex CalYearRegexPattern();

    [GeneratedRegex(TermPattern, RegexOptions.IgnoreCase | RegexOptions.Compiled | RegexOptions.Singleline, "en-AU")]
    internal static partial Regex TermRegexPattern();
}
