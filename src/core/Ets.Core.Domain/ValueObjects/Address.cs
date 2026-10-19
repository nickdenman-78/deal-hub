using Ets.Core.Domain.Models;

namespace Ets.Core.Domain.ValueObjects;

/// <summary>A physical street address within an Australian state or territory.</summary>
public sealed record Address(
    string StreetAddress,
    string Suburb,
    StateOrTerritory StateOrTerritory,
    string Postcode) : IValueObject;
