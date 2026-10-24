using FluentValidation;

namespace Ets.Modules.Users.Application.Users.UnassignRole;

[UsedImplicitly]
internal sealed class UnassignRoleCommandValidator : AbstractValidator<UnassignRoleCommand>
{
    public UnassignRoleCommandValidator()
    {
        RuleFor(command => command.UserId).NotEmpty().WithMessage("A user id is required.");
        RuleFor(command => command.RoleId).NotEmpty().WithMessage("A role id is required.");
    }
}
