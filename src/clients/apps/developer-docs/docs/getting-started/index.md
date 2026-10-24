# Getting started

This section is the definitive guide to getting ETS built and running on your machine. It takes you from a clean
clone to the ETS web app signed in as the local test user, with the API, its dependencies and the developer tools
around them.

ETS is an energy trading system for participants in the Australian National Electricity Market (NEM). It
captures deals in ASX electricity futures and OTC derivatives, and supports middle and back office through the
Settlement and Risk modules. The backend is a .NET 10 modular monolith, run locally under .NET Aspire; the
frontends are Vue 3 apps in a pnpm workspace.

## Work through it in this order

| Step | Page                                          | What you end up with                                               |
| ---- | --------------------------------------------- | ------------------------------------------------------------------ |
| 1    | [Prerequisites](./prerequisites)              | The .NET SDK, Docker, Node.js, pnpm and the EF Core tools in place |
| 2    | [Project layout](./project-layout)            | A map of the repository and where each kind of code lives          |
| 3    | [Open in your IDE](./ide)                     | The solution (and the docs site) open in Rider, VS or VS Code      |
| 4    | [Build and run](./build-and-run)              | The AppHost, the API and the web app running, signed in            |
| 5    | [The database](./database)                    | Migrations added and applied, and a database client connected      |
| 6    | [Tests and code quality](./tests-and-quality) | Tests, type checks, lint and formatting passing                    |
| 7    | [The developer docs site](./developer-docs)   | This site running locally, and how to add a page to it             |
| 8    | [Next steps](./next-steps)                    | Where to read about the architecture, the domain and the rules     |

When something goes wrong, see [Troubleshooting](./troubleshooting).

## The short version

If you have the [prerequisites](./prerequisites) installed already, this is the whole loop. Each step is explained
on the pages above.

```pwsh
# From the repository root: the backend and its containers
dotnet build ets.slnx
dotnet run --project src\aspire\Ets.Aspire.AppHost

# In a second terminal: the ETS web app
cd src\clients
pnpm install
pnpm dev
```

Then open <http://localhost:5300> and sign in as **`trader` / `trader`**.

::: info Where the rules live
This site explains _how_ to work on ETS. The reasons behind the design — the architecture, the decisions and the
domain model — live in the repository's design documents, which the [Next steps](./next-steps) page links to. When
the two seem to disagree, the design documents win.
:::
