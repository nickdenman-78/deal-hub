# Open in your IDE

## The .NET solution

Open **`ets.slnx`** at the repository root. It is the one solution that holds every project: the kernel, the
modules, the host, the AppHost and the tests. Any IDE that reads the XML `.slnx` format and supports .NET 10 works:

- **JetBrains Rider.** The repository's code style lives in `.editorconfig` and `ets.sln.DotSettings`, and is
  applied with Rider's code cleanup.
- **Visual Studio** with the .NET 10 SDK.
- **VS Code** with the C# Dev Kit. `.vscode/settings.json` already sets `ets.slnx` as the default solution.

To run or debug locally, start the **`Ets.Aspire.AppHost`** project, not the API: the AppHost starts the API with
its containers and configuration. See [Build and run](./build-and-run).

::: info There is no separate .NET lint step
The Roslyn, Sonar and code-style analyzers run inside `dotnet build` (`EnforceCodeStyleInBuild=true`,
`AnalysisMode=All`), so the IDE shows the same warnings the build does. Keep builds warning-clean.
:::

## The frontends

The frontends live in the pnpm workspace under `src/clients`, which is not part of `ets.slnx`. Open `src/clients`
as a folder in VS Code or WebStorm, or attach it in Rider as below. Prettier owns formatting and ESLint owns
correctness, so enable both in your editor, with Prettier as the formatter for `.ts`, `.vue`, `.md` and `.json`.

## Attach the docs site in Rider

To open this documentation site in Rider as part of the solution:

1. In the solution explorer, switch to the **Files** view.
2. Navigate to `src/clients/apps`, right-click the `developer-docs` folder and choose **Tools | Attach to
   Solution**.

It then appears as an attached project in the **Solution** view. The same works for any other folder under
`src/clients`, or for `src/clients` as a whole.

::: warning Attach on each machine
Attached folders are not stored in the solution, so you have to attach the docs project on each machine you work
on.
:::

## Next

[Build and run ETS](./build-and-run).
