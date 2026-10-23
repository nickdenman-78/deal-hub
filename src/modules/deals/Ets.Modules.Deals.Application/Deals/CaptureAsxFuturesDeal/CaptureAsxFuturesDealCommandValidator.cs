using FluentValidation;

namespace Ets.Modules.Deals.Application.Deals.CaptureAsxFuturesDeal;

/// <summary>
///     Shape only: every part of the quote is present. Whether the code is a listed product, the volume whole
///     lots and the price on the tick are the aggregate's rules.
/// </summary>
[UsedImplicitly]
internal sealed class CaptureAsxFuturesDealCommandValidator : AbstractValidator<CaptureAsxFuturesDealCommand>
{
    public CaptureAsxFuturesDealCommandValidator()
    {
        RuleFor(command => command.ProductCode).NotEmpty().WithMessage("A product code is required.");
        RuleFor(command => command.Direction).NotNull().WithMessage("A trade direction is required.");
        RuleFor(command => command.Price)
            .Must(price => price?.Value is not null)
            .WithMessage("A price is required.");
        RuleFor(command => command.Volume)
            .Must(volume => volume?.Value is not null)
            .WithMessage("A volume is required.");
    }
}
