// Licensed to the.NET Foundation under one or more agreements.
// The.NET Foundation licenses this file to you under the MIT license.

namespace Ets.Core.Domain.Models;

/// <summary>
/// An immutable value object defined by its attributes rather than identity. Corresponds to a CML
/// <c>ValueObject</c> (including <see cref="Ets.Core.Domain.ValueObjects.Enumeration{TValue,TEnum}"/> types).
/// </summary>
public interface IValueObject : IDomainObject;
