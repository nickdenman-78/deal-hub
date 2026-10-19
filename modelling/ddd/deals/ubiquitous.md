# Deal Capture Context Ubiquitous Language

This glossary is the canonical language source for `DealCaptureContext` (`modelling/ddd/deals/deals.cml`).
Shared-kernel terms (Term, Volume, Amount, NEM Region, …) are defined in `../shared/ubiquitous.md`.

## Terms

### Deal Id
- **Definition:** The identity of a deal: a Guid v7 generated when the deal is captured. It is also the key of
  the deal's event stream. It is never shown to people; they quote a deal by its business reference.
- **Owning context:** DealCaptureContext
- **Allowed synonyms:** None
- **CML element:** `ValueObject DealId`

### Deal Name
- **Definition:** A trader-facing name for a deal. Never blank.
- **Owning context:** DealCaptureContext
- **Allowed synonyms:** None
- **CML element:** `ValueObject DealName`

### Retail Deal
- **Definition:** A deal captured in the Deal Capture context; the aggregate root of the `RetailDeal`
  aggregate. A retail deal exists from the moment it is captured.
- **Owning context:** DealCaptureContext
- **Allowed synonyms:** None
- **CML element:** `Aggregate RetailDeal`, `Entity RetailDeal`

### Capture
- **Definition:** Recording a new deal in the system. Capturing a retail deal gives it its Deal Id.
- **Owning context:** DealCaptureContext
- **Allowed synonyms:** Deal entry
- **CML element:** `Aggregate RetailDeal` (creation)
