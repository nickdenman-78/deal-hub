# ADR-0002 — Endpoints discovered by DI, composed per module

**Status:** Accepted

A vertical slice's route lives in one `internal sealed class : IEndpoint` in the module's Presentation
project. `AddEndpoints(assembly)` registers every implementation it finds via `TryAddEnumerable`;
`MapEndpoints(fromAssembly)` maps them. Adding a slice means adding one file; nothing in the host changes.

## Why not map everything in one call

One `app.MapEndpoints()` at the host gives every endpoint the same route prefix, OpenAPI document, tags and
authorization, because whichever group is mapped first swallows them all. A separate OpenAPI document per
module (so generated clients follow the module boundary) and per-module policies cannot be expressed that
way. Hence the `fromAssembly` filter: each module maps only its own endpoints into its own `MapGroup`, and
sets prefix, tags and document once on the group. A slice declares only its own part of the route —
`"{dealId}"`, not `"/api/deals/{dealId}"`.

## Why not register endpoints explicitly

Hand-registration is fine for a handful of routes. At several modules of many slices it becomes dozens of
registration lines whose only failure mode is silent: a forgotten line is an endpoint that simply is not
there.

## Endpoints must not take constructor dependencies

`MapEndpoints` resolves implementations from the **root** provider, because mapping happens once at
startup with no request scope. A constructor dependency would capture a singleton copy of a scoped service
or fail at startup. Per-request services go on the route delegate:

```csharp
app.MapGet("{dealId}", static async (
    string dealId,
    IQueryHandler<GetDealQuery, DealResponse> handler,
    CancellationToken cancellationToken) => { ... });
```

An architecture test asserts every `IEndpoint` has a parameterless constructor.

## Consequences

- There is no dispatcher. Endpoints inject the closed handler interface directly and still get the
  decorated chain ([ADR-0008](./0008-cqrs-decorators-registered-once.md)).
- `Ets.Core.Presentation.EndpointExtensions` is the only copy of the scan, so the mechanism changes in one
  place.
- The route group carries no authorization of its own; each endpoint states its policy, so a new write
  route cannot silently inherit read authorization.
