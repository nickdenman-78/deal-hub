using FluentValidation;

namespace Ets.Modules.Users.Application.Users.RegisterUser;

/// <summary>Shape only: an identity and a user name. Their lengths and the identity's uniqueness are checked later.</summary>
[UsedImplicitly]
internal sealed class RegisterUserCommandValidator : AbstractValidator<RegisterUserCommand>
{
    public RegisterUserCommandValidator()
    {
        RuleFor(command => command.IdentityId).NotEmpty().WithMessage("An identity id is required.");
        RuleFor(command => command.UserName).NotEmpty().WithMessage("A user name is required.");
    }
}
