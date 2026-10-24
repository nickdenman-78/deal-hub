# ETS — Domain-Driven Design model

The Context Mapper (CML) files in this directory are the **source of truth** for the ETS domain model.
C# domain code under `src/` is a reflection of them (see `docs/architecture/adr/0009-model-first-ddd-with-context-mapper.md`
and the `ddd` skill in `.claude/skills/ddd/`).

This readme is the verbal overview: what each bounded context is for and how they relate. Keep it in step
with the CML.

## Ubiquitous language

Each context keeps its canonical glossary next to its CML:

- `shared/ubiquitous.md` — shared-kernel, cross-context terms only
- `{context}/ubiquitous.md` — one per bounded context

## Layout

```
modelling/ddd/
  shared/shared.cml                SharedContext (shared kernel)
  {context}/{context}.cml          entry point: Domain/Subdomain, ContextMap, BoundedContext, imports
  {context}/{context}.{part}.cml   one file per aggregate or major entity tree
  {context}/ubiquitous.md          glossary
```

## Bounded contexts

_Describe each context here once it is modelled: its purpose, its aggregates and their lifecycles, the
commands that drive it, and its relationships on the context map (shared kernel, upstream/downstream,
ACL/OHS/PL)._

### SharedContext (`shared/shared.cml`)

The shared kernel: the value objects every context speaks in. Basic numbers (`Percent`, `Money`, `Factor`,
`Number`), quantities with explicit units (`Amount` per kW/MW/kWh/MWh, `Volume` in kW/MW/kWh/MWh), contact
and legal identifiers (`EmailAddress`, `PhoneNumber`, `ABN`, `ACN`, `Address`), time (`DateValue`,
`DateRange`, `TimeRange`, `Term`, `CronSchedule`) and the NEM's geography (`NEMRegion`, `StateOrTerritory`,
`HolidayState`). It has no aggregates. Implemented in `src/core/Ets.Core.Domain`.

### DealCaptureContext (`deals/deals.cml`)

Captures deals, all in its `Deals` module. Its one aggregate so far is `ExchangeDeal`, identified by a
`DealId`, whose `AsxFuturesDeal` subtype captures ASX electricity futures from a product code, direction,
price and volume (`AsxFuturesDealCaptured`); `DealName` is the trader-facing name. It shares the kernel (`[SK]<->[SK] SharedContext`). Implemented in `src/modules/deals/` (event sourced).

### IdentityContext (`users/users.cml`)

Decides what each signed-in person may do, in its `Users` module. A `Role` is a named set of `Permission`s;
a `User` is a Keycloak identity (`IdentityId`, the token's `sub`) holding `RoleAssignment`s. A user's
permissions are the union of their roles' permissions. Implemented in `src/modules/users/` (EF Core, schema
`users`).

## Rendering

The Context Mapper VS Code extension renders context maps and PlantUML diagrams. A local PlantUML server
can be configured in `.vscode/settings.json` (`plantuml.render: PlantUMLServer`).
