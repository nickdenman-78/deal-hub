using FluentValidation;

namespace Ets.Modules.Users.Application.Users.AssignRole;

[UsedImplicitly]
internal sealed class AssignRoleCommandValidator : AbstractValidator<AssignRoleCommand>
{
    public AssignRoleCommandValidator()
    {
        RuleFor(command => command.UserId).NotEmpty().WithMessage("A user id is required.");
        RuleFor(command => command.RoleId).NotEmpty().WithMessage("A role id is required.");
    }
}
