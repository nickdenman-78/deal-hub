using FluentValidation;

namespace Ets.Modules.Users.Application.Roles.RevokePermission;

/// <summary>Shape only: a role and a permission. The permission's format is the domain's rule.</summary>
[UsedImplicitly]
internal sealed class RevokePermissionCommandValidator : AbstractValidator<RevokePermissionCommand>
{
    public RevokePermissionCommandValidator()
    {
        RuleFor(command => command.RoleId).NotEmpty().WithMessage("A role id is required.");
        RuleFor(command => command.Permission).NotEmpty().WithMessage("A permission is required.");
    }
}
