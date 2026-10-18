---
paths:
  - "docs/**"
  - "**/CONTEXT.md"
  - "modelling/**/*.md"
---

# Documentation rules

- **Design docs record decisions, not progress.** Explain the problem, the options, the decision and the
  rule that follows. Never write status, plans, phases, task checklists or dated "done / not yet" entries —
  those belong in commits and PRs. A reader should not be able to tell in what order the work happened.
- **Rewrite decisions in place** in `architecture.md`, `CONTEXT.md` and glossaries. **ADRs are the
  exception**: they are dated records — supersede with a new ADR and update the old one's status.
- **Deliberate limits are design; unfinished work is not.** A boundary ("not enforced because …") belongs in
  the design doc. A gap goes in `src/CONTEXT.md` under **Known gaps**, phrased as the current shape, never
  as a plan.
- Changing module structure, host composition or the auth model updates `docs/architecture/architecture.md`,
  `src/CONTEXT.md` and the ADRs in the same change.
