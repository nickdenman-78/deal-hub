// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.

using System.Globalization;
using System.Reflection;
using System.Text.Json.Serialization;
using Ets.Core.Domain.Models;

namespace Ets.Core.Domain.ValueObjects;

#pragma warning disable CA1724
#pragma warning disable CA1000

public abstract record Enumeration<TValue, TEnum>(
    [property: JsonPropertyOrder(10)] TValue Value,
    [property: JsonPropertyOrder(20)] string Name)
    : IValueObject
    where TValue : Enum
    where TEnum : Enumeration<TValue, TEnum>
{
    private static readonly Dictionary<TValue, TEnum>? EnumerationsCache;

    protected static readonly Dictionary<TValue, TEnum> Enumerations = EnumerationsCache ??= CreateEnumerations();

    [UsedImplicitly] public long Integral => Convert.ToInt64(Value, CultureInfo.InvariantCulture);

    private static Dictionary<TValue, TEnum> CreateEnumerations()
    {
        var enumerationType = typeof(TEnum);

        var fields = typeof(TEnum).GetFields(
                BindingFlags.Public |
                BindingFlags.Static |
                BindingFlags.FlattenHierarchy |
                BindingFlags.DeclaredOnly)
            .Where(fi => enumerationType.IsAssignableFrom(fi.FieldType))
            .Select(fi => (TEnum)fi.GetValue(default(TValue))!);

        return fields.ToDictionary(x => x.Value, x => x);
    }

    public static TEnum? FromValue(TValue value)
    {
        return Enumerations.GetValueOrDefault(value);
    }

    [UsedImplicitly]
    public static TEnum? FromName(string name)
    {
        return Enumerations.Values.SingleOrDefault(x => x.Name.Equals(name, StringComparison.OrdinalIgnoreCase));
    }

    public override int GetHashCode()
    {
        return Value.GetHashCode();
    }

    public override string ToString()
    {
        return Name;
    }
}

#pragma warning restore CA1000
#pragma warning restore CA1724
