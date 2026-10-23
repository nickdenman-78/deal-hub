# ADR-0005 — Module configuration: sections in the standard configuration chain

**Status:** Accepted

ETS uses the **standard .NET configuration chain** — no configuration server. A module's configuration is a
**named section of the host's one `IConfiguration`**, bound to a typed options class the module owns, with
**defaults in code** and validation at startup. Module-owned settings live under **`Modules:{Module}`**.
Infrastructure connections come from **Aspire**, secrets from a **secret store**, and settings the business
changes at runtime are **domain data**, not configuration.

## The chain

Lowest to highest precedence, as the default host builds it:

1. **Options-class defaults** in code.
2. `appsettings.json` in the host — non-secret overrides only, one section per module.
3. `appsettings.{Environment}.json` — environment-specific overrides.
4. User secrets (Development only).
5. Environment variables — how Aspire locally, and the deployment platform elsewhere, supplies connection
   strings and secrets.
6. Command line.

```json
{
  "Modules": {
    "Deals": { "References": { "Prefix": "ETS-D-" } },
    "Risk": { "MarkToMarket": { "Cron": "0 30 18 ? * MON-FRI" } }
  }
}
```

## The section constant is the contract

```csharp
public sealed class MarkToMarketOptions
{
    public const string SectionName = "Modules:Risk:MarkToMarket";

    public string Cron { get; init; } = "0 30 18 ? * MON-FRI";

    public TimeSpan PriceStalenessLimit { get; init; } = TimeSpan.FromHours(4);
}
```

Everything that names the setting does so through the constant — the bind, the validation message, the
error when a value is missing — so it cannot be renamed in one place and not the others. Because modules
know only section names, the *source* of the values can change without touching a module.

**Defaults live in the options class.** A module runs with no configuration at all, and its configuration
surface can be read off its options classes. `appsettings*.json` carries only overrides.

## Bound by the adapter that needs it, validated at startup

There is no module-wide options blob. Each adapter binds its own section in its own registration extension,
and the options class lives in the project that consumes it. The host passes `IConfiguration` down; a module
never builds one.

```csharp
services.AddOptions<MarkToMarketOptions>()
    .Bind(configuration.GetSection(MarkToMarketOptions.SectionName))
    .Validate(o => CronExpression.IsValidExpression(o.Cron), $"{MarkToMarketOptions.SectionName}:Cron is not a valid cron expression.")
    .ValidateOnStart();
```

Binding the root instead of the named section silently yields defaults or nulls; `ValidateOnStart` turns a bad
value into a startup failure that names the key. Validation is graded:

- **Required** — the module cannot run without it: absent or malformed fails startup.
- **Absent-but-legal** — validate the *shape* at startup; assert *presence* where the adapter is resolved,
  naming the setting.
- **Absent-and-substituted** — the code default applies; nothing to fail.

Options are consumed through `IOptions<T>`. **There is no hot reload**: a change means a restart, so every
instance runs on the same values. Serilog log levels are the one exception.

## Infrastructure connections come from Aspire

PostgreSQL, Redis, RabbitMQ, Keycloak and Seq are AppHost resources. Aspire injects their connection
information as environment variables (`ConnectionStrings__ets-db`, `ConnectionStrings__redis`, …) and the
client integrations read them. **No module declares or binds a connection string.** Deployed environments
supply the same names from the Aspire manifest or the platform.

## Secrets never live in files

- Locally: Aspire parameters marked secret, stored in the AppHost's user secrets.
- Deployed: the platform's secret store (e.g. Key Vault references in Azure Container Apps), surfaced as
  environment variables; or `AddAzureKeyVault` as an extra configuration source if needed.
- `appsettings*.json` contains no credentials, not even empty placeholders.

## Business settings are domain data

Trading limits, settlement cut-off times, holiday calendars, fee schedules, curve sources and similar values
change at runtime, need permissions to change, and need an audit trail. They are modelled in the owning
module (CML first), stored in its database, and changed through its endpoints. Application configuration is
reserved for **technical** settings: schedules, batch sizes, timeouts, cache durations, feature switches.
This split is what keeps a central configuration service unnecessary.

## Feature flags

If needed, `Microsoft.FeatureManagement` reading `FeatureManagement:*` from the same chain.

## Why not something else

- **A configuration server** (as retail-systems built): a second deployable to build, secure and keep
  available, solving a problem ETS does not have while it is one host with technical-only configuration.
- **A file per module** (`modules.{name}.json`, as in Evently): a second loading mechanism, a hard startup
  coupling when a file is missing (or a silently empty bind when optional), and one more place to edit per
  module. One host file with a section per module keeps ownership clear without that.

## When to revisit

Introduce a central store when several independently deployed processes must change shared settings
together, or operators must change technical settings without a deployment. Then add **Azure App
Configuration** (or the cloud equivalent) as one more source in the host chain — not a custom server.
Modules are unaffected, because they only know their section names.

## Consequences

- A module's configuration surface is its options classes; overrides are discoverable under
  `Modules:{Module}` in one host file.
- A missing or malformed setting is always named — at startup, or by the adapter that needs it.
- The repository holds no secrets and no environment-specific connection strings.
