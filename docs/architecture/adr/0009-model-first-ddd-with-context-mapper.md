# ADR-0009 — Model-first DDD with Context Mapper

**Status:** Accepted

The domain model is authored in **Context Mapper CML** under `modelling/ddd/`, and the CML is the **source
of truth**. C# domain code is a reflection of it, produced and kept in step with the `ddd` skill
(`.claude/skills/ddd/`). When the two disagree, the CML wins: update the C#, or decide explicitly to change
the CML first.

## Layout

```
modelling/ddd/
  readme.md                       verbal overview of the contexts and context map
  shared/shared.cml               SharedContext — the shared kernel
  shared/ubiquitous.md            cross-context terms only
  {context}/{context}.cml         entry point: Domain/Subdomain, ContextMap, BoundedContext; imports the rest
  {context}/{context}.{part}.cml  one file per aggregate or major entity tree (e.g. deal.otc-deal.cml)
  {context}/ubiquitous.md         that context's glossary
```

## Rules that follow

- **One CML `BoundedContext` → one module** (shared kernel → `src/core/Ets.Core.Domain`). The module folder
  is chosen deliberately and recorded in the skill's mapping table; it is not derived from the context name.
- **Relationships are explicit.** `[SK]<->[SK]` means the types live in the shared kernel.
  `[D,ACL]<-[U,OHS,PL]` means the downstream module consumes the upstream's published contracts
  (its IntegrationEvents) through an anti-corruption layer — never its internals.
- **Keep the shared kernel minimal and stable** — primitives such as money, price, volume, NEM region,
  term/strip, load profile, holidays and encoded ids. Business data crosses contexts by published language.
- **CML `extends` becomes C# inheritance**, intermediate levels abstract and leaves sealed — never
  flattened into one class with a discriminator. The derivative product tree (futures, caps, swaps,
  options) is exactly the kind of structure that must stay the shape the model gives it.
- **Every new term goes into the owning context's `ubiquitous.md` in the same change.** CML stays concise
  and executable; prose definitions live in the glossary. A word that means different things in different
  contexts gets context-specific terms and a translation rule at the ACL boundary.
- **Graded rigour.** Core contexts get rich aggregates; supporting contexts may be lighter; generic or
  read-side contexts may be transaction scripts.

## Why

Trading products are structurally rich, and the cost of an implicit model is high: a swap, a cap and a
strip option share vocabulary but not settlement behaviour. Modelling first makes aggregate boundaries,
lifecycles and context relationships reviewable by domain experts before code exists, and gives an agent a
precise, checkable target instead of generic DDD boilerplate.

## Consequences

- A domain change starts in the CML and the glossary, then the code.
- `docs/external/context-mapper/context-mapper-docs-context7.md` is the in-repo CML syntax reference.
