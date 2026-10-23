# ADR-0016 — Observability and health checks

**Status:** Accepted

**Logs:** Serilog, structured, to the console and **Seq**; `writeToProviders: true` so the OpenTelemetry
logging provider (and the Aspire dashboard) still receives them.
**Traces and metrics:** OpenTelemetry via `Ets.Aspire.ServiceDefaults`, exported over OTLP to the **Aspire
dashboard** locally and to **Seq** as the persistent trace store. No Jaeger.
**Health:** ASP.NET Core health checks, `/alive` for liveness and `/health` for readiness.

## Why

Seq ingests both logs and OTLP traces, so one tool answers "what happened to this deal" from a trace id
through every log line, HTTP call, SQL statement and message hop. Jaeger (Evently) would be a second store
with no logs in it.

## Logging rules

- Request logging via `UseSerilogRequestLogging()`, after the exception handler.
- The command/query logging decorator pushes **`Module`** and **`RequestName`** into the log context and
  tags the current `Activity`; middleware pushes **`TraceId`**. Wolverine handlers do the same for
  `MessageType`.
- Never log message bodies or command payloads containing prices, volumes or counterparty data at
  Information level; log identifiers.
- Library noise (Wolverine durability agent, Quartz) is overridden to `Warning`.

## Tracing sources

ASP.NET Core, HttpClient, EF Core, Npgsql, Redis, **Wolverine** (`AddSource("Wolverine")`), Marten, Quartz.
W3C trace context propagates across RabbitMQ, so a deal confirmation and the settlement and risk work it
triggers form one trace.

## Health checks

- Aspire client integrations register checks for PostgreSQL, Redis and RabbitMQ automatically; Keycloak is
  checked via its `/health/ready` endpoint; Wolverine contributes broker health.
- Readiness includes every dependency the host cannot serve without; liveness includes none (a dependency
  outage must not restart the process).
- The JSON response writer is enabled for `/health`; HealthChecks UI is not deployed.
