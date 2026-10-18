---
paths:
  - "modelling/**"
---

# Domain modelling rules

- CML here is the source of truth; C# follows it (use the `ddd` skill to generate or check drift).
- CML syntax reference: `docs/external/context-mapper/context-mapper-docs-context7.md`.
- Each context has a folder with an entry-point `{context}.cml` (Domain/Subdomain, ContextMap,
  BoundedContext, imports) and one `{context}.{part}.cml` per aggregate or major entity tree.
- Every new domain term added to CML must be added to the owning context's `ubiquitous.md` in the same
  change, using the entry format in that file.
- `shared/` holds only genuinely cross-context, stable terms (the shared kernel). If a term is used by one
  context, it belongs there.
- If the same word means different things in different contexts, use context-specific terms and document
  the translation at the ACL boundary in both glossaries.
- Keep CML concise and executable: structure, constraints and precise names, with short comments only for
  disambiguation. Prose definitions belong in `ubiquitous.md`.
- Commands that mutate an aggregate carry the aggregate root's id.
- Adding a new `BoundedContext` means adding its row to `.claude/skills/ddd/references/mapping.md` and to
  `docs/architecture/architecture.md`.
