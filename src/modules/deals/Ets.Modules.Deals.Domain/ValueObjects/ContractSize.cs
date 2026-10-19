using Ets.Core.Domain.Models;
using Ets.Core.Domain.ValueObjects;

namespace Ets.Modules.Deals.Domain.ValueObjects;

/// <summary>
///     The energy one lot (1 MW) delivers over a contract's term, in MWh, and the number of days it covers.
/// </summary>
/// <remarks>
///     Base load is days x 24 h; peak and morning/evening peak sizes depend on ASX's holiday schedule, so the
///     size is published by ASX per listed contract rather than computed here.
/// </remarks>
public sealed record ContractSize : IValueObject
{
    public const string InvalidErrorCode = "deal.contract-size.invalid";

    private ContractSize(int numberOfDays, Volume energy)
    {
        NumberOfDays = numberOfDays;
        Energy = energy;
    }

    [UsedImplicitly] public int NumberOfDays { get; }

    /// <summary>MWh per lot over the term.</summary>
    [UsedImplicitly] public Volume Energy { get; }

    [UsedImplicitly]
    public static Result<ContractSize> Create(int numberOfDays, Volume energy)
    {
        ArgumentNullException.ThrowIfNull(energy);

        if (numberOfDays <= 0)
        {
            return Result.Failure<ContractSize>(DomainError.Validation(
                InvalidErrorCode,
                $"A contract covers at least one day, not {numberOfDays}."));
        }

        if (energy.Unit != VolumeUnit.MWh || energy.Value is not > 0)
        {
            return Result.Failure<ContractSize>(DomainError.Validation(
                InvalidErrorCode,
                $"A contract size is a positive energy in MWh, not '{energy}'."));
        }

        return new ContractSize(numberOfDays, energy);
    }
}
