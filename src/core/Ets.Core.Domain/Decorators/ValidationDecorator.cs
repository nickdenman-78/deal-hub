using FluentValidation;
using FluentValidation.Results;
using Ets.Core.Domain.CQRS;
using Ets.Core.Domain.Models;

namespace Ets.Core.Domain.Decorators;

#pragma warning disable CA1812
internal static class ValidationDecorator
{
    private static async Task<ValidationFailure[]> ValidateAsync<TCommand>(
        TCommand command,
        IEnumerable<IValidator<TCommand>> validators)
    {
        var validatorsList = validators.ToList();

        if (validatorsList.Count == 0)
        {
            return [];
        }

        var context = new ValidationContext<TCommand>(command);

        var validationResults = await Task.WhenAll(
            validatorsList.Select(v => v.ValidateAsync(context))).ConfigureAwait(false);

        var validationFailures = validationResults
            .Where(vr => !vr.IsValid)
            .SelectMany(vr => vr.Errors)
            .ToArray();

        return validationFailures;
    }

    private static ValidationError CreateValidationError(ValidationFailure[] validationFailures)
    {
        // Must be DomainErrorType.Validation: ValidationError.FromResults filters on that type, so
        // building these as DomainError.Problem silently discarded every failure and left Errors empty.
        return ValidationError.FromResults([
            .. validationFailures.Select(f => DomainError.Create(
                string.IsNullOrWhiteSpace(f.PropertyName) ? f.ErrorCode : f.PropertyName,
                f.ErrorMessage,
                DomainErrorType.Validation))
        ]);
    }

    [UsedImplicitly]
    internal sealed class CommandHandler<TCommand, TResponse>(
        ICommandHandler<TCommand, TResponse> decorated,
        IEnumerable<IValidator<TCommand>> validators)
        : ICommandHandler<TCommand, TResponse>
        where TCommand : ICommand<TResponse>
    {
        public async Task<Result<TResponse>> HandleAsync(TCommand command, CancellationToken cancellationToken)
        {
            var validationFailures = await ValidateAsync(command, validators).ConfigureAwait(false);

            if (validationFailures.Length == 0)
            {
                return await decorated.HandleAsync(command, cancellationToken).ConfigureAwait(false);
            }

            return Result.Failure<TResponse>(CreateValidationError(validationFailures));
        }
    }

    [UsedImplicitly]
    internal sealed class CommandBaseHandler<TCommand>(
        ICommandHandler<TCommand> decorated,
        IEnumerable<IValidator<TCommand>> validators)
        : ICommandHandler<TCommand>
        where TCommand : ICommand
    {
        public async Task<Result> HandleAsync(TCommand command, CancellationToken cancellationToken)
        {
            var validationFailures = await ValidateAsync(command, validators).ConfigureAwait(false);

            if (validationFailures.Length == 0)
            {
                return await decorated.HandleAsync(command, cancellationToken).ConfigureAwait(false);
            }

            return Result.Failure(CreateValidationError(validationFailures));
        }
    }
}

#pragma warning restore CA1812
