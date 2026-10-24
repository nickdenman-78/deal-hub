# A request, end to end

The quickest way to see how the layers fit together is to follow one request. This page traces
`POST /api/deals/asx-futures`, which captures an ASX futures deal, from the SPA to the Marten event store. Every
participant and step in the diagram is taken from the code; open the full-screen view to follow each one to its
source.

<iframe src="/diagrams/archify/capture-asx-futures-deal.html" title="Capturing an ASX futures deal: one request through the layers" loading="lazy" style="width: 100%; height: 640px; border: 1px solid var(--vp-c-divider); border-radius: 8px"></iframe>

[Open the diagram full screen](/diagrams/archify/capture-asx-futures-deal.html){target="_blank"}

## Step by step

| Step                  | Where                                                                              | What happens                                                                                                                                                            |
| --------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Send               | `src/clients/apps/ets/src/api/client.ts`                                           | The SPA sends the request with the Keycloak access token as a `Bearer` header.                                                                                          |
| 2. Authenticate       | `Ets.Servers.Api/Authentication`                                                   | The JWT bearer handler validates the token's issuer and audience against Keycloak.                                                                                      |
| 3. Add permissions    | `Ets.Modules.Users.Infrastructure/Authorization/PermissionClaimsTransformation.cs` | Users looks up the caller's roles by the token's `sub` and adds a `permission` claim for each permission they grant.                                                    |
| 4. Authorize          | `Ets.Core.Infrastructure/Authorization`                                            | The endpoint's policy, `deals:capture`, requires that permission claim.                                                                                                 |
| 5. Bind               | `Ets.Modules.Deals.Presentation/Deals/CaptureAsxFuturesDeal.cs`                    | The endpoint turns the request DTO into a `CaptureAsxFuturesDealCommand` and calls the injected `ICommandHandler<CaptureAsxFuturesDealCommand, Guid>`.                  |
| 6. Decorate           | `Ets.Core.Domain/Decorators`                                                       | The logging decorator tags the log context and trace with the module and request; the validation decorator runs `CaptureAsxFuturesDealCommandValidator`.                |
| 7. Decode and look up | `CaptureAsxFuturesDealCommandHandler`, `AsxProductCatalogue`                       | `ProductCode.Create` decodes the code (`BNH26` is NSW base load for `Q126`), then the catalogue finds the listed product and its contract size in `deals.asx_products`. |
| 8. Capture            | `Ets.Modules.Deals.Domain/Models/AsxFuturesDeal.cs`                                | `AsxFuturesDeal.Capture` checks the $0.01/MWh tick and whole lots, and raises `AsxFuturesDealCaptured` with a new Guid v7 `DealId`.                                     |
| 9. Save               | `ExchangeDealRepository`, `DealsUnitOfWork`                                        | The repository only tracks the deal; the unit of work starts its stream in `deals_events` and saves the Marten session.                                                 |
| 10. Respond           | `ResultExtensions.Match`, `ApiResults.Problem`                                     | Success is `201 Created` with the deal id; a failure becomes problem details with the status its error type maps to.                                                    |

## What each failure looks like

Every failure on this path is a `Result` carrying a `DomainError`, not an exception, so the endpoint maps all of them
in one place.

| Failure                                    | Raised by                  | Error type   | Status |
| ------------------------------------------ | -------------------------- | ------------ | ------ |
| A missing or malformed field               | The validation decorator   | `Validation` | 400    |
| A product code that does not decode        | `ProductCode.Create`       | `Validation` | 400    |
| A product not in the ASX product catalogue | `AsxProductCatalogue`      | `NotFound`   | 404    |
| A price off the tick, or a part lot        | `AsxFuturesDeal.Capture`   | `Validation` | 400    |
| Someone else changed the stream first      | `DealsUnitOfWork`          | `Conflict`   | 409    |
| The caller lacks `deals:capture`           | ASP.NET Core authorization | —            | 403    |
| No valid token                             | The JWT bearer handler     | —            | 401    |

## The current shape

The capture path ends at the event store. `src/CONTEXT.md` records what lies beyond it under _Known gaps_; in short:

- The `Location` header names `/api/deals/{id}`, but there is no projection and no read route, so a captured deal
  cannot be read back.
- The Deals unit of work saves the Marten session alone. There is no Wolverine outbox, so no integration event leaves
  the module.
- The ASX product catalogue table is empty until ASX's contract size schedule is loaded into it, so every product code
  is reported as not listed.
