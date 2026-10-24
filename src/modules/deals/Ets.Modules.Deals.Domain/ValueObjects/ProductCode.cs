using System.Globalization;
using Ets.Core.Domain.Models;
using Ets.Core.Domain.ValueObjects;

namespace Ets.Modules.Deals.Domain.ValueObjects;

/// <summary>
///     The ASX 24 product code a trader quotes: commodity code + expiry month letter + 2-digit expiry year,
///     e.g. <c>BNH26</c> (NSW base load Q1 2026) or <c>ENF27</c> (NSW base load January 2027).
/// </summary>
/// <remarks>
///     The <see cref="Term" /> is derived from the code:
///     <list type="bullet">
///         <item>month: the expiry month itself (<c>Jan27</c>);</item>
///         <item>quarter: the quarter ending in the expiry month, H, M, U or Z only (<c>Q126</c>);</item>
///         <item>
///             strip: a Z expiry is the calendar year after expiry (<c>HNZ26</c> is <c>Cal27</c>); an M expiry
///             the financial year starting after expiry (<c>HNM26</c> is <c>Fin26/27</c>).
///         </item>
///     </list>
///     A code that does not decode to a listed product is rejected. Whether ASX currently lists it is the
///     <c>IAsxProductCatalogue</c>'s call.
/// </remarks>
public sealed record ProductCode : IValueObject
{
    public const string InvalidErrorCode = "deal.product-code.invalid";

    private ProductCode(string value, CommodityCode commodityCode, ContractMonth expiryMonth, int expiryYear, Term term)
    {
        Value = value;
        CommodityCode = commodityCode;
        ExpiryMonth = expiryMonth;
        ExpiryYear = expiryYear;
        Term = term;
    }

    [UsedImplicitly] public string Value { get; }

    [UsedImplicitly] public CommodityCode CommodityCode { get; }

    [UsedImplicitly] public ContractMonth ExpiryMonth { get; }

    /// <summary>The four-digit expiry year.</summary>
    [UsedImplicitly] public int ExpiryYear { get; }

    [UsedImplicitly] public Term Term { get; }

    /// <summary>Decodes a product code such as <c>BNH26</c>, ignoring case and surrounding white space.</summary>
    [UsedImplicitly]
    public static Result<ProductCode> Create(string? value)
    {
        string code = value?.Trim().ToUpperInvariant() ?? string.Empty;

        if (code.Length != 5 ||
            !int.TryParse(code.AsSpan(3), NumberStyles.None, CultureInfo.InvariantCulture, out int twoDigitYear))
        {
            return Invalid(value, "it is not a commodity code, a month letter and a 2-digit year");
        }

        var commodityCodeResult = CommodityCode.Create(code[..2]);

        if (commodityCodeResult.IsFailure)
        {
            return Invalid(value, $"'{code[..2]}' is not an ASX electricity futures commodity code");
        }

        if (!ContractMonth.TryFromCode(code[2..3], out var expiryMonth))
        {
            return Invalid(value, $"'{code[2]}' is not a futures month letter");
        }

        var commodityCode = commodityCodeResult.Value;
        int expiryYear = 2000 + twoDigitYear;
        var expiry = new DateOnly(expiryYear, expiryMonth.Month, 1);

        // Term.Create keeps the dates it is given (it only aligns them to name the term), so every term ends on
        // the last day of its final month.
        var expiryMonthEnd = expiry.AddMonths(1).AddDays(-1);

        return commodityCode.Period.Value switch
        {
            ContractPeriodValue.Month => new ProductCode(code, commodityCode, expiryMonth, expiryYear,
                Term.Create(expiry, expiryMonthEnd)),
            ContractPeriodValue.Quarter when expiryMonth.Month % 3 == 0 => new ProductCode(code, commodityCode,
                expiryMonth, expiryYear, Term.Create(expiry.AddMonths(-2), expiryMonthEnd)),
            ContractPeriodValue.Quarter => Invalid(value, "a quarter contract expires in H, M, U or Z"),
            ContractPeriodValue.Strip when expiryMonth.Value is ContractMonthValue.Dec or ContractMonthValue.Jun =>
                new ProductCode(code, commodityCode, expiryMonth, expiryYear,
                    Term.Create(expiry.AddMonths(1), expiryMonthEnd.AddMonths(12))),
            ContractPeriodValue.Strip => Invalid(value, "a strip expires in M (financial year) or Z (calendar year)"),
            _ => throw new InvalidOperationException($"Unmapped contract period '{commodityCode.Period}'.")
        };
    }

    public override string ToString()
    {
        return Value;
    }

    private static Result<ProductCode> Invalid(string? value, string reason)
    {
        return Result.Failure<ProductCode>(DomainError.Validation(
            InvalidErrorCode,
            $"'{value}' is not an ASX electricity futures product code: {reason}."));
    }
}
