var builder = DistributedApplication.CreateBuilder(args);

// Every container here is a LOCAL DEVELOPMENT CONVENIENCE (ADR-0007). They are persistent so a restart of the
// AppHost does not re-pull and re-initialise them, and they start empty on first run: schemas are created by
// each module's migrations (Development only) and by Wolverine, Marten and Quartz for their own tables.

// One PostgreSQL database, a schema per module (ADR-0010).
var postgres = builder.AddPostgres("postgres")
    .WithLifetime(ContainerLifetime.Persistent);

var database = postgres.AddDatabase("ets");

// FusionCache L2 and backplane (ADR-0012).
var redis = builder.AddRedis("redis")
    .WithLifetime(ContainerLifetime.Persistent);

// Module-to-module messaging through Wolverine (ADR-0011). The management UI is linked from the dashboard.
var rabbitMq = builder.AddRabbitMQ("rabbitmq")
    .WithManagementPlugin()
    .WithLifetime(ContainerLifetime.Persistent);

// Identity provider (ADR-0006). The port is fixed so the token issuer (https://localhost:8080/realms/ets) is
// the same URL the API validates against and the browser signs in at. Aspire gives Keycloak the HTTPS developer
// certificate and serves the fixed port over HTTPS (`dotnet dev-certs https --trust` once per machine). The realm
// export in ./Realms is imported on the container's first start; to re-import after editing it, delete the container.
const string realm = "ets";

var keycloak = builder.AddKeycloak("keycloak", 8080)
    .WithRealmImport("./Realms")
    .WithLifetime(ContainerLifetime.Persistent);

// Logs (Serilog sink) and, when OTLP is pointed at it, traces (ADR-0016).
var seq = builder.AddSeq("seq")
    .WithLifetime(ContainerLifetime.Persistent);

// The "https" launch profile (https://localhost:7201, plus http://localhost:5201), not the first one, which is
// plain HTTP.
builder.AddProject<Projects.Ets_Servers_Api>("ets-api", launchProfileName: "https")
    // ConnectionStrings__ets / __redis / __rabbitmq, the shape the Aspire client integrations read. A deployed
    // host receives the same keys from its environment, without the AppHost.
    .WithReference(database)
    .WithReference(redis)
    .WithReference(rabbitMq)
    // Mapped onto the host's own named sections (ADR-0005) rather than a connection-string convention.
    .WithEnvironment("Keycloak__Authority", ReferenceExpression.Create($"{keycloak.GetEndpoint("http")}/realms/{realm}"))
    .WithEnvironment("Seq__ServerUrl", seq.GetEndpoint("http"))
    .WaitFor(database)
    .WaitFor(redis)
    .WaitFor(rabbitMq)
    .WaitFor(keycloak)
    .WaitFor(seq);

await builder.Build().RunAsync().ConfigureAwait(false);
