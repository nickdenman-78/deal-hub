# ADR-0004 — IntegrationEvents is the module's public API

**Status:** Accepted

`Ets.Modules.{Module}.IntegrationEvents` is the **only** project another module or the host may reference.
Everything else in a module is internal to it. The project must stay reference-light — ideally referencing
nothing — because every dependency it takes is inherited by each consumer.

## What goes in it

- Integration event contracts published to, and consumed by, other modules (e.g. `DealConfirmed` consumed
  by Settlement and Risk).
- Read-side snapshots another context needs — the small projection a consumer gets instead of the
  aggregate.
- Permission names (`{Module}Permissions`), because which permissions a module defines is part of its
  contract. How it enforces them is not.
- The module's configuration contract where the host needs to know it.

## Why this matters

The five-project split ([ADR-0001](./0001-layered-csprojs-per-module.md)) stops a consumer reaching into a
module's internals *by accident*. This ADR gives it somewhere to reach *instead*. Without a designated
front door, the shortcut gets taken anyway: one Risk handler needs one field off a Deals aggregate, takes a
reference, and nothing breaks — until the boundary is decorative. Deciding the front door before the
second module exists is much cheaper than after.

It is enforced by tests, in both directions:

- No module may depend on another module's namespace, except its `IntegrationEvents`.
- `IntegrationEvents` may not depend on its own module's Domain, Application, Infrastructure or
  Presentation.

The isolation rule names **planned modules by namespace before they exist**, so it applies from their
first line of code rather than being switched on after a shortcut has been taken.

## Consequences

- The host references each module's `IntegrationEvents` explicitly (to read permission names) rather than
  relying on it arriving transitively.
- Putting a type here is a deliberate act with a cost. If two modules need the same domain concept, the
  question is whether the boundary is in the right place, not whether to widen the contract.
- Do not casually add an `Ets.Core.Domain` reference: a `Result` or `Enumeration<>` in a contract makes
  every consumer take that dependency too.
