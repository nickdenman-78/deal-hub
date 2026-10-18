# ADR-0001 — Layered csprojs per module

**Status:** Accepted

Each module is five projects — `Ets.Modules.{Module}.{Domain, Application, Infrastructure,
IntegrationEvents, Presentation}` — not one project with layer folders.

```
Domain            → Ets.Core.Domain
IntegrationEvents → (nothing)
Application       → Domain, Ets.Core.Domain
Infrastructure    → Application, IntegrationEvents, Ets.Core.Infrastructure
Presentation      → Application, Ets.Core.Presentation
Host              → Infrastructure, Presentation, IntegrationEvents
```

`Application → Infrastructure`, `Presentation → Infrastructure` and `Infrastructure → Presentation` are all
forbidden, and the host references neither a module's Application nor its Domain.

## Why

- **Cross-module isolation is a real requirement.** A module never touches another's tables, and
  cross-module reads go through local read models. With one csproj per module, `Risk` referencing `Deals`
  compiles and drags all of Deals' internals along. With the split, only a reference to
  `Deals.IntegrationEvents` compiles without also pulling in Application and Infrastructure
  ([ADR-0004](./0004-integration-events-as-public-api.md)).
- **An assembly boundary is a mechanism; a convention is a hope.** Folder layering relies on code review
  and namespace discipline. Across several modules and contributors — human and agent — that erodes.
- **The core modules are not thin.** Deal capture, settlement and risk each carry real aggregates and
  external adapters, so the layers are not empty ceremony.

## What it costs

Five projects per module, and a module with genuinely nothing in a layer still carries an almost-empty
csproj. Restore time and IDE load are worse than a collapsed layout. If that becomes the dominant pain,
the migration is mechanical: move source folders into one csproj keeping the sub-namespaces, delete the
other csprojs, and switch the architecture tests from `Types.InAssembly` to `Types.InNamespace`.

## Consequences

- The layer rules are enforced by `tests/architecture/EtsArchitectureTests`, not by review. They are only
  meaningful because the boundaries are real.
- Every layer project exposes an `AssemblyReference` class so DI scanning and the architecture tests have
  a compile-time handle.
