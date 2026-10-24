# ETS — Energy Trading System

ETS captures deals and supports settlement and risk for participants in the Australian National Electricity
Market (NEM): ASX electricity futures, strips and options, and OTC derivatives (swaps, caps and options). The
backend is a .NET 10 modular monolith run locally under .NET Aspire; the frontends are Vue 3 apps in a pnpm
workspace under `src/clients`.

**The definitive developer guide is the _Getting started_ section of the developer docs site.** Start the site as
below and follow it from prerequisites to a running, signed-in ETS.

## Run the developer docs

You need [Node.js](https://nodejs.org/) 22 or later and [pnpm](https://pnpm.io/) (`npm install -g pnpm`; the
workspace pins its own version in `src/clients/package.json` and pnpm switches to it).

```bash
cd src/clients
pnpm install
pnpm --filter @ets/app-developer-docs dev
```

Then open <http://localhost:5173/getting-started/>.

AI coding agents: read [`CLAUDE.md`](CLAUDE.md) first.
