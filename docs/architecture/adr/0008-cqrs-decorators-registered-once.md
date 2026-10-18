# ADR-0008 — CQRS decorators registered once, by the host

**Status:** Accepted

`AddMediator(assemblies)` registers handlers. `AddMediatorPipeline()` applies the validation and logging
decorators. Each module calls the first; **the host calls the second, once, after every module has
registered.**

```csharp
builder.Services
    .AddDealsModule(builder.Configuration)
    .AddDealsEndpoints(dealsPolicies);
builder.Services
    .AddSettlementModule(builder.Configuration)
    .AddSettlementEndpoints(settlementPolicies);

builder.Services.AddMediatorPipeline();   // last
```

## Why they cannot be the same call

**Decorators are open-generic and apply to what is already registered.** Scrutor's `Decorate` rewrites the
descriptors present when it runs. Called per module, module A's handlers are wrapped when A registers and
again when B registers, while B's are wrapped once. Guarding with an "already done" flag swaps that for the
opposite bug: everything after the first module is never decorated. Decoration is a whole-container
operation and belongs where the whole container is known.

**`Decorate` throws when nothing matches.** A module may legitimately have no queries, or no commands
without a response, so the pipeline uses `TryDecorate`.

## Decorator order

Validation is registered before logging. Scrutor applies decorators innermost-first, so logging ends up
outermost and records validation failures as well as handler outcomes.

## Consequences

- A module registered without `AddMediatorPipeline()` gets undecorated handlers — no validation, no logging.
  A host smoke test should resolve a handler and assert the decorator chain is present.
- Endpoints inject the closed handler interface directly ([ADR-0002](./0002-endpoints-discovered-by-di.md))
  and still get the decorated chain.
