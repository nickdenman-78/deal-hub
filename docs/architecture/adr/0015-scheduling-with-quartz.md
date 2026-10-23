# ADR-0015 — Scheduling with Quartz.NET, work done by Wolverine

**Status:** Accepted

Time-based work (end-of-day mark-to-market after ASX settlement prices publish, settlement runs, market-data
pulls) is triggered by **Quartz.NET** (Apache-2.0) with a **clustered PostgreSQL job store**. A Quartz job does
one thing: send a Wolverine command. The work itself runs as a durable, retried, traced message handler.

## Why

- Quartz has cron triggers, **holiday calendars** (NEM/ASX public holidays drive trading-day schedules) and
  clustering so a job fires once across several instances. Wolverine's scheduled messages are delay-based
  and have no calendar.
- Keeping the job thin means retries, idempotency and observability come from the messaging pipeline
  instead of being reimplemented per job.
- Hangfire's useful features are paid; TickerQ is promising but young.

## Rules

- Jobs live in the owning module's Infrastructure and are registered by its composition root; schedules are
  configuration (`SectionName` options), not code constants.
- Every scheduled command carries its **business date** so a rerun or catch-up is deterministic and
  idempotent.
- Outbox/inbox polling is **not** a Quartz job — Wolverine's durability agent handles it.
- Quartz uses its own schema (`quartz`) in the shared database; its tables are created by migration script.
