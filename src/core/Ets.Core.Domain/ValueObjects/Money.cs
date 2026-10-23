using Ets.Core.Domain.Models;

namespace Ets.Core.Domain.ValueObjects;

/// <summary>A monetary amount in Australian dollars. Persisted at 18,4 precision.</summary>
public sealed record Money(decimal Value) : IValueObject;
