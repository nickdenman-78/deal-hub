namespace EtsArchitectureTests.Abstractions;

/// <summary>
///     Technology namespaces that inner layers must not see. Each list names the root namespace of a
///     library, so every type beneath it is covered.
/// </summary>
internal static class ForbiddenNamespaces
{
    /// <summary>How a model is stored: EF Core and the PostgreSQL driver.</summary>
    internal static readonly string[] Persistence =
    [
        "Microsoft.EntityFrameworkCore",
        "Npgsql",
        "Dapper"
    ];

    /// <summary>How a request arrives: ASP.NET Core.</summary>
    internal static readonly string[] Web =
    [
        "Microsoft.AspNetCore"
    ];

    /// <summary>
    ///     The platform adapters chosen in ADR-0011 to ADR-0015: messaging, event store, scheduling, caching
    ///     and the broker and cache clients beneath them. Domain and Application never reference these;
    ///     Infrastructure adapts them.
    /// </summary>
    internal static readonly string[] Platform =
    [
        "Wolverine",
        "JasperFx",
        "Marten",
        "Quartz",
        "ZiggyCreatures.Caching.Fusion",
        "StackExchange.Redis",
        "RabbitMQ"
    ];

    /// <summary>Everything a domain model must not know about.</summary>
    internal static string[] ForDomain => [.. Persistence, .. Web, .. Platform];

    /// <summary>
    ///     What an application layer must not know about. EF Core is allowed — query handlers may project
    ///     straight to response DTOs (ADR-0010) — but the driver, the web and the platform adapters are not.
    /// </summary>
    internal static string[] ForApplication => ["Npgsql", "Dapper", .. Web, .. Platform];
}
