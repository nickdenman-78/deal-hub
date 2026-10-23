// Licensed to the.NET Foundation under one or more agreements.
// The.NET Foundation licenses this file to you under the MIT license.

namespace Ets.Core.Domain.Specifications;

public static class Constants
{
    internal static class Base30
    {
        // Base30 characters and negative sign - this is used to generate the base30 string representation of an Int64
        [UsedImplicitly] public const string Base30Chars = "UFXBTJN2KWA3G4ZR5ESD6M7V8C9PHY";

        [UsedImplicitly] public const long Base30Radix = 30;

        [UsedImplicitly] public const char NegativeSign = 'L';

        // Pre-calculate the maximum length needed for any Int64 value in base 30
        // Log(2^64) / Log(30) ≈ 13.68, so 14 chars max + 1 for sign = 15
        [UsedImplicitly] public const int MaxLength = 15;
    }
}
