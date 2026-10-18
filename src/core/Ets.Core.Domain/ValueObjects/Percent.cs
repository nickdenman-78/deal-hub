using Ets.Core.Domain.Models;

namespace Ets.Core.Domain.ValueObjects;

public sealed record Percent(decimal Value) : IValueObject;
