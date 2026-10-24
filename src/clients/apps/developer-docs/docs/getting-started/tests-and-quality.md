# Tests and code quality

## The backend

```bash
dotnet build ets.slnx    # also runs the Roslyn, Sonar and code-style analyzers
dotnet test ets.slnx     # every test project
```

The tests are xUnit v3 projects with Shouldly assertions. To run one project, or one test:

::: code-group

```pwsh [PowerShell]
dotnet test tests\architecture\EtsArchitectureTests\EtsArchitectureTests.csproj
dotnet test tests\modules\deals\EtsDealsTests\EtsDealsTests.csproj --filter "FullyQualifiedName~Confirm_Fails_WhenCancelled"
```

```bash [bash]
dotnet test tests/architecture/EtsArchitectureTests/EtsArchitectureTests.csproj
dotnet test tests/modules/deals/EtsDealsTests/EtsDealsTests.csproj --filter "FullyQualifiedName~Confirm_Fails_WhenCancelled"
```

:::

`EtsArchitectureTests` enforces the module boundaries and naming rules with ArchUnitNET: run it whenever you add a
project, a reference or a new kind of class. Integration tests use Testcontainers, so they need Docker running.

::: info No separate .NET lint
Analyzer and code-style warnings come out of `dotnet build`. There is no other .NET lint or format command; keep
the build warning-clean, and apply the C# house style with Rider's code cleanup.
:::

## The frontends

Run these from `src/clients`; each runs across every package in the workspace.

```bash
pnpm test           # vitest (each package's test:unit script)
pnpm typecheck      # vue-tsc
pnpm lint           # eslint
pnpm format         # prettier --write
pnpm format:check   # prettier --check, without changing files
```

To run one package's tests, filter by its name, for example `pnpm --filter @ets/app-ets test:unit`.

Prettier owns formatting (120 columns, single quotes, semicolons, trailing commas, LF) and ESLint owns
correctness. Note that this differs from the C# style, which has no trailing commas.

## Before you push

- `dotnet build ets.slnx` with no new warnings, and `dotnet test ets.slnx` passing.
- `pnpm typecheck`, `pnpm test`, `pnpm lint` and `pnpm format:check` passing in `src/clients`.
- If you changed this site, its build passing — see [The developer docs site](./developer-docs).

## Next

[Run the developer docs site](./developer-docs).
