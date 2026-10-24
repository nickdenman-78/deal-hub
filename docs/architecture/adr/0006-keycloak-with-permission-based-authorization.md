# ADR-0006 — Keycloak with permission-based authorization

**Status:** Accepted

**Keycloak** (Apache-2.0) is the identity provider: it authenticates users and issues JWTs. **Authorization
is permission-based and owned by ETS**: roles and the permissions they grant live in the **Users** module's
schema, and each request's principal is enriched with permission claims. Endpoints require permissions,
never roles.

## Why

A trading system needs fine-grained segregation of duties (capture vs amend vs confirm vs approve
settlement vs override a limit), and the business will want to change who may do what without a redeploy or
an identity-provider change. Keycloak runs as a container under Aspire and in Testcontainers, so local and
test environments behave like production. Entra ID app roles were considered and rejected: they put that mapping in a tenant ETS does not
control, and they cannot be run locally or in tests.

## Shape

- **Keycloak** owns credentials and sessions. The Users module provisions users in Keycloak through its
  admin API and stores the Keycloak subject as the user's identity id.
- **Users module** owns `users`, `roles`, `role_permissions`, `user_roles`.
- **Each module declares its permission catalogue** in its IntegrationEvents project:

  ```csharp
  public static class DealsPermissions
  {
      public const string Read = "deals:read";
      public const string Capture = "deals:capture";
      public const string Confirm = "deals:confirm";
      public static IReadOnlyList<string> All { get; } = [Read, Capture, Confirm];
  }
  ```

- **The host registers one policy per declared permission** from every module's `All` list. There is **no
  dynamic policy provider**: a synthesised policy turns a typo into a permissive route. The authorization set
  stays enumerable at startup, and an endpoint naming an undeclared permission fails the first time its policy
  is evaluated.
- **An `IClaimsTransformation`** resolves the caller's permissions from the Users module's published query
  (`IUserPermissionsQuery` in `Users.IntegrationEvents`) and adds `permission` claims. Results are cached
  in FusionCache keyed by identity id and invalidated by the Users module's role-change events.
- Endpoints receive permission names from the host (`{Module}AuthorizationPolicies`), exactly as ADR-0003
  describes.

## Details that are easy to get wrong

- Validate issuer and audience explicitly; Keycloak's default audience is `account` unless a client-scope
  mapper adds the API audience — configure the mapper rather than accepting `account`.
- The claims transformation runs on every request — it must hit the cache, and it must be idempotent (skip
  when the permission identity is already present).
- The SPA gets the caller's permissions from `GET /api/me`, never by decoding tokens.
- There is no switch that disables authorization.

## Consequences

- A **Users** module is added (Domain/Application/Infrastructure/IntegrationEvents/Presentation).
- Keycloak's realm export lives in the repo for local and test environments; production realm configuration
  is managed as infrastructure.
