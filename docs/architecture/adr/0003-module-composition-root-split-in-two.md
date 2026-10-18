# ADR-0003 — Module composition root split in two

**Status:** Accepted

Every module exposes three extension methods, and the host calls all three:

```csharp
builder.Services
    .AddDealsModule(builder.Configuration)                           // Infrastructure — services
    .AddDealsEndpoints(new DealsAuthorizationPolicies(              // Presentation   — endpoint registrations
        DealsPermissions.Read, DealsPermissions.Capture, DealsPermissions.Confirm));

app.MapDealsModule();                                                // Presentation   — routes
```

`Add{Module}Module` lives in **Infrastructure** and wires the use cases and their adapters.
`Add{Module}Endpoints` and `Map{Module}Module` live in **Presentation**.

## Why not one entry point

With five projects per module ([ADR-0001](./0001-layered-csprojs-per-module.md)), a single entry point
would have to live in a project that can see both the adapters and the endpoints — and none can, without
one of the forbidden references. Letting Infrastructure reference Presentation compiles, but inverts the
layering and turns "Presentation must not depend on Infrastructure" into half a rule. Splitting the root
keeps both directions forbidden at the cost of one extra line in the host.

## The host passes policy names; the module does not import them

`Add{Module}Endpoints` takes a `{Module}AuthorizationPolicies` record of policy-name strings. A module's
Presentation never references an auth constants class, so the same module can be composed into a
different host under different policies. The permission *names* are owned by the module and published from its
IntegrationEvents ([ADR-0004](./0004-integration-events-as-public-api.md)); which one guards a deployment's
routes is the host's call. A `null` policy leaves that class of endpoint anonymous, which is what lets
tests boot without an identity provider.

## Consequences

- Adding a module is three lines in `Program.cs` plus its project references. No module registry, no
  `IModule` interface, no reflection over assemblies — with a handful of modules a list of calls is easier
  to read and debug than a mechanism that assembles the same list at runtime.
