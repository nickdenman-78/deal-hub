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

## Invariants

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
| `ConnectionStrings:ets`, `:redis`, `:rabbitmq` | the AppHost passes them; nothing reads them yet | The keys the Aspire client integrations will read once a module adopts PostgreSQL, Redis or RabbitMQ. |

## Known gaps

Current shape that is incomplete, phrased as the shape ("X has a handler but no route"), never as a plan.

- **The host uses only Keycloak and Seq of the services it is given.** The AppHost starts PostgreSQL, Redis,
  RabbitMQ, Keycloak and Seq and passes their locations to `Ets.Servers.Api`, but only Keycloak (token
  validation) and Seq (logs) are used. No Aspire client integration (`AddNpgsqlDataSource`,
  `AddRedisClient`, `AddRabbitMQClient`) is registered, so `/health` checks only the process itself.
- **The local Keycloak realm is a starter.** `Realms/ets-realm.json` declares the `ets-api` audience client, a
  public `ets-scalar` PKCE client with wildcard redirects, and one `trader` user — local only. The Users
  module will provision real users.
- **The Deals module has no domain.** Its five projects carry only their composition roots, permission
  catalogue and OpenAPI document; there is no `deal` CML yet, so no aggregate, event, handler or endpoint.
- **Deals has no persistence adapter.** No Marten store (`IDealsStore`), unit of work or
  `IDealReferenceGenerator` is registered by `AddDealsModule`.
- **Permission claims are not populated.** `AddCoreAuthorization` declares one policy per permission and
  each requires a `permission` claim, but no `IClaimsTransformation` adds those claims — it depends on the
  Users module's `IUserPermissionsQuery`, which does not exist. Until it does, every permission policy
  denies.
- **The kernel has no messaging, caching or scheduling helpers.** Wolverine, Marten, FusionCache and Quartz
  registration is not in `Ets.Core.Infrastructure`; the packages are not referenced.
- **No shared-kernel CML.** `Money`, `Price`, `Volume`, `Percent`, `Factor`, `NEMRegion`,
  `StateOrTerritory`, `HolidayState` and `DateRange` exist in `Ets.Core.Domain` (carried over from the
  retail kernel) but `modelling/ddd/shared/shared.cml` does not model them yet.
- **No unit or integration test projects.** `EtsCoreTests` and `EtsDealsTests` are named in
  `InternalsVisibleTo` and in `CLAUDE.md` but do not exist; only `EtsArchitectureTests` does.
- **Convention tests skip until their subject exists.** The endpoint, handler, validator, aggregate, entity
  and domain-event conventions in `EtsArchitectureTests` report as skipped for Deals, which has none of
  those yet.

## Flagged ambiguities

Places where documents, model and code use different names for the same thing, and which one wins.

- **Anonymous endpoints.** ADR-0003 says a `null` policy leaves a class of endpoints anonymous; ADR-0006 says
  there is no switch that disables authorization. ADR-0006 wins: `DealsAuthorizationPolicies` requires every
  policy name, and tests authenticate against a Keycloak container.
