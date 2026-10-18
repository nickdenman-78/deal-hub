# ADR-0014 — Guid v7 ids and human-readable business references

**Status:** Accepted

Every entity, aggregate, event stream and message is identified by a **Guid v7** (`Guid.CreateVersion7()`
via `IIdGenerator`, so tests can control it), generated **by the domain at creation**. Things people talk
about — deals, settlements, invoices — additionally carry a **human-readable business reference** value
object (e.g. `DealReference` `ETS-D-7K3Q9X`), generated from a per-type PostgreSQL sequence encoded Base30
with a Luhn check digit.

## Why

- Ids must exist before persistence: integration events, Marten streams and child references all need them
  at the moment an aggregate is created. Store-allocated `long` keys cannot provide that.
- Guid v7 is time-ordered, so B-tree index locality on PostgreSQL stays good, unlike random v4 Guids.
- Traders and back office need short, quotable, typo-detecting references; a Guid is none of those. The
  Base30 + Luhn scheme from the retail kernel survives as the *reference* format, not the key.

## Rules

- Strongly typed id records per aggregate (`DealId(Guid Value)`); never a bare `Guid` across a module boundary
  in domain code. Integration events carry plain `Guid`s.
- References are allocated by an Infrastructure port (`IDealReferenceGenerator`) during the command, never
  derived from the Guid. A reference sequence's prefix and base are never changed once issued.
- The `Entity.UnallocatedId` concept and "EF allocates ids" rule from the retail kernel do not apply to ETS.
