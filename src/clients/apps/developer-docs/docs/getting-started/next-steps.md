# Next steps

With ETS running, read the design documents before changing anything structural. They live in the repository, not
on this site, and they are the source of truth for _why_ the code looks the way it does.

## The architecture

| Read                                | For                                                                          |
| ----------------------------------- | ---------------------------------------------------------------------------- |
| `docs/architecture/architecture.md` | The modules, the host, the shape of a module and the architecture tests      |
| `docs/architecture/kernel.md`       | The shared kernel contract: `Result`, CQRS, enumerations, ids, value objects |
| `docs/architecture/adr/index.md`    | Every architecture decision record, with what was considered and rejected    |

The ADRs most worth reading first:

- ADR-0001 and ADR-0003 — the five projects per module, and the three lines per module in the host.
- ADR-0006 — Keycloak with permission-based authorization.
- ADR-0007 — Aspire for local orchestration.
- ADR-0010 and ADR-0013 — the persistence conventions, and event sourcing with Marten.
- ADR-0011 — messaging between modules with Wolverine and RabbitMQ.

## The domain

| Read                             | For                                                                |
| -------------------------------- | ------------------------------------------------------------------ |
| `src/CONTEXT.md`                 | The domain glossary, the invariants and the known gaps             |
| `modelling/ddd/readme.md`        | How the domain is modelled in Context Mapper                       |
| `modelling/ddd/**/*.cml`         | The domain model — the source of truth when it and the C# disagree |
| `modelling/ddd/**/ubiquitous.md` | The ubiquitous language of each bounded context                    |

## The frontends

`src/clients/CONTEXT.md` holds the frontend design rules: the workspace layout, raw-source packages, shared
versions, authentication and how module screens are kept apart. Read it before adding a package.

## The working rules

`CLAUDE.md` at the repository root summarises every convention in one place: package management, the C# house
style, the kernel patterns, module and host composition, persistence and the frontend. It is written for AI coding
agents, and it is just as useful as a checklist for people.
