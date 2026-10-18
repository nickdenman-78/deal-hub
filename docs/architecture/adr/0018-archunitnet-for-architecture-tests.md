# ADR-0018 — ArchUnitNET for architecture tests

**Status:** Accepted

Architecture tests use **ArchUnitNET** (`TngTech.ArchUnitNET.xUnitV3`, Apache-2.0) with Shouldly, replacing
NetArchTest from [ADR-0017](./0017-testing-strategy.md). The rules themselves are unchanged.

## Why

- **Empty subjects fail.** ArchUnitNET fails a rule whose subjects match nothing ("the rule requires positive
  evaluation"), which is the vacuous-pass failure mode the suite otherwise guards by hand. NetArchTest passes
  such a rule.
- **Referenced types are part of the model.** `Types(includeReferenced: true)` lets a "must not depend on EF
  Core / Wolverine" rule see library types without loading those assemblies.
- **Exact namespace matching.** `ResideInNamespace` is an exact match and `ResideInNamespaceMatching` a
  regex, so `Ets.Modules.Risk` no longer prefix-matches a future `Ets.Modules.RiskReporting`.
- **Maintained, with an xUnit v3 integration.** `rule.Check(architecture)` reports the offending types and
  the `Because` reason as a v3 assertion failure. NetArchTest 1.3.2 is from 2021.

## Consequences

- The architecture is loaded once per test run (`EtsArchitecture.Architecture`); subjects are selected by
  assembly, targets by namespace tree.
- Selections ArchUnitNET cannot express exactly — open generic handler interfaces, one type's namespace
  relative to another's — are made by reflection and passed in with `Are(types)`.
- A convention whose subject does not exist yet is skipped (`Assert.SkipWhen`), not silenced with
  `WithoutRequiringPositiveResults()`, so a rule that should always have subjects stays strict.
- An empty *target* of `NotDependOnAny` still passes; canary tests point each target at a dependency known to
  exist.
