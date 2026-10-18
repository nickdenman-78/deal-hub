# ADR-0012 — Caching with FusionCache and Redis

**Status:** Accepted

Caching uses **FusionCache** (MIT) with an in-memory L1, **Redis** as the distributed L2, and the **Redis
backplane** so every host instance drops its L1 copy when an entry changes. Application code depends on the
**`HybridCache`** abstraction (FusionCache registered as its implementation via `AsHybridCache()`), so the
provider can be swapped without touching modules.

## Why

| Option | Why not chosen |
|---|---|
| `HybridCache` alone | No cross-instance L1 invalidation; with more than one host instance, stale reads after an update. |
| `IDistributedCache` + own wrapper (Evently) | No L1, no stampede protection, and Evently's version silently falls back to memory when Redis is down. |

FusionCache adds what a trading system needs from a cache: fail-safe (serve the last good value for a bounded
time when the source fails), soft/hard timeouts, eager refresh and the backplane.

## Rules

- **Cache only what may be stale for a stated period.** Market data (forward curves, ASX settlement prices,
  AEMO prices), reference data and permission sets are the expected workload. Deal state and positions are
  never served from cache to a write path.
- **Fail-safe is set per entry type**, with a maximum stale duration written next to the cache key
  definition. For prices used in valuation the stale age must be visible to the caller.
- **Keys are namespaced by module** (`deals:…`, `marketdata:curve:{region}:{date}`) and defined as constants
  in the owning module.
- **Redis being unavailable is a readiness failure**, not a silent fallback.
- Values are serialised with System.Text.Json; cached types are immutable DTOs, never domain aggregates.
- Invalidation on change is driven by the module's own integration events or by explicit `RemoveAsync`/tags.
