# Testing

Tests are xUnit v3 with Shouldly, in projects that mirror the source tree. The architecture tests are what make the
module boundaries real: without them, the five-project split would be a convention rather than a mechanism. The
strategy is ADR-0017, with the architecture test tooling in ADR-0018. Running the tests is covered in
[Tests and code quality](../getting-started/tests-and-quality).

## The levels

| Level        | Scope                                                                            | Tools                                                                                                            |
| ------------ | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Unit         | Aggregates, value objects, event application, handlers with fakes                | xUnit v3, **Shouldly**, Bogus                                                                                    |
| Integration  | One module through its HTTP endpoints and messaging, against real infrastructure | `WebApplicationFactory` + **Testcontainers** (PostgreSQL, Redis, RabbitMQ, Keycloak), Wolverine tracked sessions |
| Architecture | The layer graph, module isolation and conventions                                | **ArchUnitNET** + Shouldly                                                                                       |

| Project                                   | Covers                                                                                      |
| ----------------------------------------- | ------------------------------------------------------------------------------------------- |
| `tests/architecture/EtsArchitectureTests` | Every module and the kernel: boundaries, layering, naming, visibility                       |
| `tests/core/EtsCoreTests`                 | The kernel's value objects: `Amount`, `Volume`, `Term`, `CronSchedule`, contact identifiers |
| `tests/modules/deals/EtsDealsTests`       | The Deals domain, the capture handler and the Deals event JSON                              |
| `tests/modules/users/EtsUsersTests`       | The Users domain, its use cases, the claims transformation and the permissions query        |

::: info Current shape
There are no integration test projects, so nothing runs against Testcontainers: the Marten repository, the unit of
work and the capture route are untested against a real database (`src/CONTEXT.md`, _Known gaps_). The Users
permissions query is tested against in-memory SQLite.
:::

## Rules for writing tests

- **Shouldly, never FluentAssertions**, which is commercial from v8.
- **Test names use underscores**: `Confirm_Fails_WhenDealIsCancelled`.
- **Assert on the returned `Result`**, because a business-rule failure is a result, not an exception.
- **Data-driven cases** use `TheoryData<>` with `[MemberData]`.
- **Inject time and ids.** Use `FrozenDateTimeProvider` and a controllable `IIdGenerator`, so tests are deterministic.
- **Event-sourced aggregates** are tested as _given events → when command → then events or result_;
  `EventSourcedAggregate<TId>.LoadFromHistory` rebuilds the given state.
- **Asynchronous outcomes** are asserted with Wolverine's `TrackActivity()` or `InvokeMessageAndWaitAsync`, **never
  with sleeps**.
- Test projects are executables (`<OutputType>Exe</OutputType>`, set once in `tests/Directory.Build.props`), as xUnit
  v3 requires.

## What the architecture tests guard

`EtsArchitectureTests` loads the whole solution once per run and checks rules in these groups:

| Group                  | Examples                                                                                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Layer dependencies     | The five-project graph per module; Domain free of EF Core and ASP.NET Core; Domain and Application free of Wolverine, Marten, Quartz, FusionCache and Npgsql |
| Kernel dependencies    | `src/core` depends on no module; each kernel layer exposes an `AssemblyReference`                                                                            |
| Host dependencies      | The host never depends on a module's Application or Domain                                                                                                   |
| Module isolation       | No module depends on another's namespace except its IntegrationEvents; IntegrationEvents depends on none of its own module's layers                          |
| Domain conventions     | Aggregates use the module's persistence model; entities have no public setters or constructors; domain events are sealed and immutable                       |
| Endpoints and handlers | Endpoints are `internal sealed` with a parameterless constructor; handlers are `sealed` and live only in Application                                         |
| Naming and placement   | `{UseCase}Command`/`Query`, `{Request}Handler`, `{T}Validator`, `{Entity}Map`, `Db{Entity}`, `{Fact}V{n}`, options with a `SectionName`                      |
| Permissions            | Each module declares a catalogue; every permission is in `All` and namespaced by its module                                                                  |
| Slices and colocation  | Use-case slices do not depend on each other; a command, its handler, validator and response share a folder                                                   |
| Visibility             | Handlers, validators, endpoints, maps and `Db*` rows are `internal`                                                                                          |

Three safeguards stop a rule from passing for the wrong reason:

- **Planned modules are listed by namespace** (Settlement, Risk, MarketData, Counterparties) in
  `Abstractions/EtsModules.cs`, so isolation applies from their first line of code.
- **Canary tests** point each dependency rule at a dependency known to exist and require it to be caught, so a typo
  in a namespace turns a test red instead of making the rule assert nothing.
- **Empty subjects fail.** ArchUnitNET fails a rule that matches nothing; a convention whose subject does not exist
  yet is skipped visibly with `Assert.SkipWhen`, never silenced.

When you add a module, add it to `EtsModules.All` so every rule covers it.
