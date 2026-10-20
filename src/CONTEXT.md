# ETS — domain context

The authoritative glossary pointer and invariant list for `src/`. Read this before changing domain code;
it records the rules that are not derivable from the types alone.

> Architecture decisions live in [`docs/architecture/adr/`](../docs/architecture/adr/). This file is about
> the domain; those are about the structure. Per-context vocabulary lives in
> `modelling/ddd/{context}/ubiquitous.md`.

## Vocabulary

Terms whose meaning in code is not obvious from the glossary — how a term is *represented*, where it is
owned, and which word not to use. One entry per term:

```markdown
### Term
What it means here, which module owns it, and the word(s) to avoid.
```

### Term
A period of whole months in the shared kernel (`Ets.Core.Domain.ValueObjects.Term`, a `DateRange`). Its span
and name (`Apr26`, `Q126`, `JJ26`, `Cal26`, `Fin22/23`, `Feb26-May26`) are derived from its dates.
`Term.Create(name)` also accepts `Fin2223`, `Fin23` (meaning Fin22/23) and a bare compliance year. Avoid
"tenor" and "period" for it.

### Amount
A dollar value with an explicit `AmountUnit` (`c/kWh`, `$/MWh`, `c/kW`, `$/MW`, or none for plain dollars),
in the shared kernel. Distinct from `Money` (plain dollars) and `Price` (always $/MWh).

## Invariants

### Shared kernel

- **Terms always cover whole months.** `Term.Create(start, end)` widens its dates to the first and last day
  of their months, because every naming convention is month-based.
- **Contact identifiers that carry `IsValid` keep invalid input.** `PhoneNumber`, `ABN` and `ACN` flag a
  failed check instead of rejecting, as the CML models it, so imported counterparty data is never lost.
- **Cron schedules are Quartz expressions, evaluated outside the domain.** `CronSchedule` accepts only
  Quartz-shaped expressions (six or seven fields, one `?` day field) and holds no scheduler; occurrences and
  full validation come from `ICronScheduleEvaluator` (Quartz, in Infrastructure), because the architecture
  tests keep Quartz out of Domain and Application, and jobs are scheduled with Quartz (ADR-0015).

### Deals

- **A deal's id is assigned by its first event.** A deal's captured event (e.g. `AsxFuturesDealCaptured`) is
  always the first event of its stream; the id comes from `IIdGenerator`, never from the store (ADR-0014).
- **ASX futures prices and volumes are checked unrounded.** `Amount` and `Volume` round `Value` to four
  decimals, so `AsxFuturesDeal.Capture` checks the $0.01/MWh tick and whole lots against `RawValue`; otherwise
  95.505 would pass as a price.
- **A product code's term is derived, never entered.** `ProductCode.Create` decodes `BNH26` to `Q126` and a
  strip's Z or M expiry to the following `Cal` or `Fin` year (`HNZ26` is `Cal27`), so a deal's term cannot
  disagree with its code.
- **Deals keeps reference data in EF Core and deals in Marten.** `DealsDbContext` (schema `deals`) holds only
  lookup data such as `asx_products`; a deal is never a row there, because ADR-0013 keeps every Deals
  aggregate in its event stream.

Rules every change must preserve, grouped by module. State each as a rule and its reason.

## Module boundaries

A module's `IntegrationEvents` project is the only thing other modules may reference
([ADR-0004](../docs/architecture/adr/0004-integration-events-as-public-api.md)). A module never reads
another module's tables. Cross-module reads go through a local read model; cross-module writes go through
integration events.

## Configuration

The sections each module binds, named by their `SectionName` constants.

| Section | Bound by | Notes |
|---|---|---|
| `Holidays` | `Ets.Core.Application` — `HolidayServiceOptions.SectionName` | Optional. Holiday calendar cache size and expiry; absent means defaults (caching on, no expiry). |
| `Keycloak` | `Ets.Servers.Api` — `KeycloakOptions.SectionName` | Required: `Authority` (realm URL, also the issuer) and `Audience` (`ets-api`). `ReferenceUiClientId` lets the Scalar UI sign in, Development only. `RequireHttpsMetadata` is `false` only for the local container. The AppHost supplies `Authority`. |
| `Seq` | `Ets.Servers.Api` — `SeqOptions.SectionName` | Optional. `ServerUrl` (and `ApiKey`) for the Serilog sink; absent means console only. The AppHost supplies `ServerUrl`. |
| `Cors:Origins` | `Ets.Servers.Api` | Optional. Browser origins allowed to call the API; empty means none. |
| `ConnectionStrings:ets` | `Ets.Modules.Deals.Infrastructure` — `DealsDbContext.ConnectionStringName` | The AppHost passes it. Read directly by `UseNpgsql`, until the Aspire Npgsql client integration is adopted. |
| `ConnectionStrings:ets` (design time) | `DealsDbContextFactory`, from `Ets.Modules.Deals.Infrastructure/appsettings.Migrations.json` | Only the `dotnet ef` tools read it, never the API, so ADR-0005's host-only rule is unaffected. Overridden by the git-ignored `appsettings.Migrations.local.json` and the `ConnectionStrings__ets` environment variable; no password is committed. |
| `ConnectionStrings:redis`, `:rabbitmq` | the AppHost passes them; nothing reads them yet | The keys the Aspire client integrations will read once a module adopts Redis or RabbitMQ. |

## Known gaps

Current shape that is incomplete, phrased as the shape ("X has a handler but no route"), never as a plan.

- **The host uses only Keycloak and Seq of the services it is given.** The AppHost starts PostgreSQL, Redis,
  RabbitMQ, Keycloak and Seq and passes their locations to `Ets.Servers.Api`, but only Keycloak (token
  validation) and Seq (logs) are used. No Aspire client integration (`AddNpgsqlDataSource`,
  `AddRedisClient`, `AddRabbitMQClient`) is registered, so `/health` checks only the process itself.
- **The local Keycloak realm is a starter.** `Realms/ets-realm.json` declares the `ets-api` audience client, a
  public `ets-scalar` PKCE client with wildcard redirects, and one `trader` user — local only. The Users
  module will provision real users.
- **`CaptureAsxFuturesDealCommand` has a handler but no route.** Its handler needs `IExchangeDealRepository`
  and `IDealsUnitOfWork`, which nothing implements yet, so it cannot be resolved in the host.
- **Deals has no event store.** No Marten store (`IDealsStore`), `IExchangeDealRepository`, unit of work or
  `IDealReferenceGenerator` is registered by `AddDealsModule`.
- **The ASX product catalogue is empty.** `deals.asx_products` backs `IAsxProductCatalogue`, but nothing loads
  ASX's contract size schedule into it, so every product code is reported as not listed.
- **Permission claims are not populated.** `AddCoreAuthorization` declares one policy per permission and
  each requires a `permission` claim, but no `IClaimsTransformation` adds those claims — it depends on the
  Users module's `IUserPermissionsQuery`, which does not exist. Until it does, every permission policy
  denies.
- **The kernel has no messaging, caching or scheduling helpers.** Wolverine, Marten, FusionCache and Quartz
  job registration is not in `Ets.Core.Infrastructure`; Quartz is referenced only to evaluate `CronSchedule`
  expressions (`QuartzCronScheduleEvaluator`).
- **`Price` has no shared-kernel CML.** `modelling/ddd/shared/shared.cml` models every other kernel value
  object, but `Price` ($/MWh) exists only in `Ets.Core.Domain`.
- **No integration test projects.** `EtsCoreTests` and `EtsDealsTests` hold unit tests of the kernel value
  objects and the Deals domain; nothing yet runs against Testcontainers.
- **Convention tests skip until their subject exists.** The endpoint, handler and validator conventions in
  `EtsArchitectureTests` report as skipped for Deals, which has none of those yet.

## Flagged ambiguities

Places where documents, model and code use different names for the same thing, and which one wins.

- **Anonymous endpoints.** ADR-0003 says a `null` policy leaves a class of endpoints anonymous; ADR-0006 says
  there is no switch that disables authorization. ADR-0006 wins: `DealsAuthorizationPolicies` requires every
  policy name, and tests authenticate against a Keycloak container.
- **`DealCaptureContext`'s CML module is not a namespace.** `deals.cml` groups its elements in
  `Module Deals`, but the Deals domain keeps `Models/`, `ValueObjects/` and `Events/` at the project
  root, because the architecture tests pin domain events to `Ets.Modules.Deals.Domain.Events`. The code wins
  until the tests change.
- **`Address.address` is `StreetAddress` in code.** A C# member cannot share its type's name.
- **`CronSchedule`'s dates and time zone are richer than the CML.** The CML has `Date startDate`,
  `Date endDate` and `String timeZone`; the C# has `DateTimeOffset?` dates and a `TimeZoneInfo`.
- **Some kernel value objects throw instead of returning `Result`.** `EmailAddress`, `Term.Create(name)` and
  the Deals `DealName` (from retail-systems) throw `ArgumentException` on invalid input, where the kernel
  convention is `Result.Failure(DomainError.*)`.
- **`DateValue`, `TimeRange` and `EmailAddress` differ in shape from the CML.** `DateValue.TimePart` is a
  `TimeOnly` and `TimeZoneInfo` a `TimeZoneInfo` (CML: `String`); `EmailAddress.IsValid` means "not empty".
- **`FuturesPayoff.strike` is nullable in code.** The CML has `Decimal strike`; the C# `Strike` is `decimal?`,
  `null` for standard futures, which have no strike.
- **`AsxFuturesDealCaptured.occurredAt` is a `DateTimeOffset`.** The CML has `DateTime`; `IDomainEvent` wins.
- **`AsxProductCatalogue` is the async port `IAsxProductCatalogue`.** Its lookup is I/O, so
  `FindListedProductAsync` returns `Task<Result<AsxProduct>>` where the CML returns `AsxProduct`.
- **Base load's `TimeRange` ends at `TimeOnly.MaxValue`.** The CML says 00:00-24:00; 24:00 is not a `TimeOnly`.
