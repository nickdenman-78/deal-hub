using FluentValidation;

namespace Ets.Modules.Users.Application.Roles.CreateRole;

/// <summary>Shape only: a name and a list of permissions. Their format and the name's uniqueness are checked later.</summary>
[UsedImplicitly]
internal sealed class CreateRoleCommandValidator : AbstractValidator<CreateRoleCommand>
{
    public CreateRoleCommandValidator()
    {
        RuleFor(command => command.Name).NotEmpty().WithMessage("A role name is required.");
        RuleFor(command => command.Permissions).NotNull().WithMessage("A list of permissions is required; it may be empty.");
    }
}
