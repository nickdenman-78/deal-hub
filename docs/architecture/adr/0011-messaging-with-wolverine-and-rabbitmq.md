# ADR-0011 — Messaging with Wolverine and RabbitMQ

**Status:** Accepted

Cross-module communication is **asynchronous integration events**, carried by **Wolverine** (MIT) over
**RabbitMQ** for **all module-to-module traffic**, with Wolverine's **transactional outbox and inbox**
persisted in PostgreSQL. In-process command/query handling stays on the ETS kernel's own CQRS
([ADR-0008](./0008-cqrs-decorators-registered-once.md)); Wolverine is the bus, not the mediator.

## Why Wolverine

MediatR (13+) and MassTransit (9+) are now commercial. Of the free options:

| Option | Why not chosen |
|---|---|
| Hand-rolled outbox/inbox (as in Evently) | Retry, dead-lettering, poison messages, ordering and sagas would all be ours to build and test. Evently's version also serialises with `TypeNameHandling.All`, a known deserialisation hazard. |
| CAP | Good outbox and dashboard, but no sagas and no modular-monolith guidance. |
| Rebus | Mature, but its PostgreSQL outbox story is thinner and the operations UI is paid. |
| Brighter | Viable; more ceremony for the same result. |

Wolverine gives a durable outbox **and** inbox, EF Core and Marten integration, RabbitMQ, sagas, scheduled
messages, OpenTelemetry spans and published modular-monolith guidance. JasperFx sells support and the
CritterWatch monitor separately; the library itself is MIT.

## Why RabbitMQ for module-to-module traffic

Durable local queues would work inside one process. Routing every integration event through RabbitMQ
instead means work is load-balanced across host instances and separate workers (end-of-day mark-to-market
is the expected first worker), external systems can subscribe, and extracting a module later is a
configuration change. The cost is a broker in every environment, including tests (Testcontainers).

## How it fits the module structure

- **Published contracts** are plain, versioned records in the producer's `IntegrationEvents` project
  (`DealConfirmedV1`) — no Wolverine or kernel types, per [ADR-0004](./0004-integration-events-as-public-api.md).
- **Domain events stay inside a module.** After an aggregate changes, the module's unit of work maps the
  relevant domain events to integration events and publishes them through Wolverine's EF Core outbox
  (`IDbContextOutbox<TContext>` → `SaveChangesAndFlushMessagesAsync()`), so the state change and the
  outgoing messages commit in one transaction. Event-sourced modules use the Marten outbox integration.
- **Consumers are Wolverine handlers in the consuming module's Infrastructure** (an inbound messaging
  adapter). A consumer translates the integration event into the module's own command and invokes the
  kernel command handler — Application never references Wolverine.
- **Idempotency** comes from the durable inbox: a message is processed once per destination.

## Configuration that matters

```csharp
builder.UseWolverine(opts =>
{
    // Our kernel handlers end in "Handler" too — never let Wolverine adopt them.
    opts.Discovery.DisableConventionalDiscovery();
    opts.Discovery.IncludeAssembly(DealsInfrastructure.Assembly);   // per module; explicit handler types only

    opts.PersistMessagesWithPostgresql(dataSource, schemaName: "wolverine");
    opts.UseEntityFrameworkCoreTransactions();
    opts.Policies.UseDurableInboxOnAllListeners();
    opts.Policies.UseDurableOutboxOnAllSendingEndpoints();

    opts.MultipleHandlerBehavior = MultipleHandlerBehavior.Separated;          // one queue/transaction per handler
    opts.Durability.MessageIdentity = MessageIdentity.IdAndDestination;        // fan-out must not trip the inbox

    opts.UseRabbitMq(rabbitUri).AutoProvision().UseConventionalRouting();
    opts.Policies.DisableConventionalLocalRouting();                           // modules talk via the broker
    opts.UseSystemTextJsonForSerialization();
});
```

- **One shared envelope-storage schema** (`wolverine`); each module's DbContext is enrolled as an
  ancillary store so its outbox commits with its own transaction.
- **Pre-generate Wolverine's handler code** for production builds (`dotnet run -- codegen write`) so startup
  does no runtime compilation.
- **Dead letters** stay in PostgreSQL and RabbitMQ dead-letter queues; replay is an operational action,
  never automatic.

## Sagas

Multi-step cross-module workflows (e.g. confirm deal → settlement scheduled → risk position booked) are
Wolverine sagas persisted in PostgreSQL. A saga lives in the module that owns the workflow and reacts only
to published integration events.

## Consequences

- An architecture test asserts no Domain or Application project references Wolverine.
- Message tests use Wolverine's tracked sessions (`InvokeMessageAndWaitAsync`, `TrackActivity()`), with
  RabbitMQ in a Testcontainer.
- Every module consuming events needs `ets` RabbitMQ topology provisioned; `AutoProvision()` does it locally.
