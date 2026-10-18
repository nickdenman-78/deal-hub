namespace Ets.Servers.Api.Logging;

/// <summary>
///     Where Serilog sends structured logs (ADR-0016). Absent-but-legal: with no URL, logs go to the console only.
/// </summary>
internal sealed class SeqOptions
{
    public const string SectionName = "Seq";

    public string? ServerUrl { get; set; }

    /// <summary>The ingestion key, when the Seq server requires one. Never committed; user secrets locally.</summary>
    public string? ApiKey { get; set; }
}
