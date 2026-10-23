using Ets.Core.Domain.Models;

namespace Ets.Core.Domain.ValueObjects;

/// <summary>A dimensionless multiplier (for example a book-build pricing factor).</summary>
public sealed record Factor(decimal Value) : IValueObject;
