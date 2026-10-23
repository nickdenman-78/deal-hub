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

### Capture
- **Definition:** Recording a new deal in the system. Capturing a deal gives it its Deal Id. A deal exists
  from the moment it is captured.
- **Owning context:** DealCaptureContext
- **Allowed synonyms:** Deal entry
- **CML element:** `CommandEvent CaptureAsxFuturesDeal`

### Exchange Deal
- **Definition:** A deal traded on an exchange (ASX 24) and cleared by ASX Clear (Futures). The aggregate root
  of the `ExchangeDeal` aggregate; each exchange product is a subtype.
- **Owning context:** DealCaptureContext
- **Allowed synonyms:** Exchange-traded deal
- **CML element:** `Aggregate ExchangeDeal`, `Entity ExchangeDeal`

### ASX Futures Deal
- **Definition:** An Exchange Deal in an ASX Australian electricity futures contract: a cash-settled contract
  for difference against the spot price of one NEM region over the contract's Term. Captured from a Product
  Code, Trade Direction, Price and Volume.
- **Owning context:** DealCaptureContext
- **Allowed synonyms:** ASX Future, Futures deal
- **CML element:** `Entity AsxFuturesDeal`

### Trade Direction
- **Definition:** Whether the portfolio bought (Buy) or sold (Sell) the contracts.
- **Owning context:** DealCaptureContext
- **Allowed synonyms:** Buy/Sell
- **CML element:** `ValueObject TradeDirection`, `enum TradeDirectionValue`

### Product Code
- **Definition:** The ASX 24 code a trader quotes: Commodity Code, expiry Contract Month letter and 2-digit
  expiry year, e.g. `BNH26` (NSW base load Q1 2026). The Term is derived from it: a month contract covers its
  expiry month; a quarter contract the quarter ending in its expiry month (H, M, U, Z); a Strip with a Z expiry
  the following calendar year, with an M expiry the following financial year. A code that does not decode to a
  listed product is rejected.
- **Owning context:** DealCaptureContext
- **Allowed synonyms:** Contract code
- **CML element:** `ValueObject ProductCode`

### Commodity Code
- **Definition:** The two-letter ASX 24 code for a product family and region. The first letter names the family
  (E base load month, B base load quarter, H base load strip, P peak quarter, D peak strip, M morning peak
  quarter, J morning peak strip, N evening peak quarter, L evening peak strip, G $300 cap quarter, R $300 cap
  strip); the second the NEM region (N NSW, V VIC, Q QLD, S SA).
- **Owning context:** DealCaptureContext
- **Allowed synonyms:** None
- **CML element:** `ValueObject CommodityCode`

### Contract Month
- **Definition:** The expiry month of a contract, written as a futures month letter: F G H J K M N Q U V X Z for
  January to December.
- **Owning context:** DealCaptureContext
- **Allowed synonyms:** Expiry month
- **CML element:** `ValueObject ContractMonth`, `enum ContractMonthValue`

### Load Profile
- **Definition:** The trading window a contract covers (AEST): base load 00:00-24:00 Monday to Sunday; peak load
  07:00-22:00 Monday to Friday excluding public holidays; morning peak 06:00-09:00 and evening peak 16:00-21:00,
  Monday to Sunday.
- **Owning context:** DealCaptureContext
- **Allowed synonyms:** Profile
- **CML element:** `ValueObject LoadProfile`, `enum LoadProfileValue`

### Futures Payoff
- **Definition:** How a contract settles: Standard futures against the average spot price over the Term; $300
  Cap futures against the average of spot prices above $300/MWh.
- **Owning context:** DealCaptureContext
- **Allowed synonyms:** None
- **CML element:** `ValueObject FuturesPayoff`, `enum FuturesPayoffValue`

### Contract Period
- **Definition:** The period a contract is listed for: a Month (base load only), a Quarter, or a Strip.
- **Owning context:** DealCaptureContext
- **Allowed synonyms:** None
- **CML element:** `ValueObject ContractPeriod`, `enum ContractPeriodValue`

### Strip
- **Definition:** A calendar or financial year of four consecutive quarterly contracts, traded as one product.
- **Owning context:** DealCaptureContext
- **Allowed synonyms:** Yearly strip
- **CML element:** `ContractPeriodValue.Strip`

### Contract Size
- **Definition:** The energy one lot delivers over the contract's Term, in MWh, with the number of days it
  covers. Base load is days x 24 hours; peak sizes depend on ASX's holiday schedule, so sizes are taken from
  ASX's published schedule rather than computed.
- **Owning context:** DealCaptureContext
- **Allowed synonyms:** None
- **CML element:** `ValueObject ContractSize`

### ASX Product
- **Definition:** A listed ASX contract as it stood when a deal was captured: its decoded Product Code and its
  Contract Size. Kept on the deal so later schedule changes do not alter captured deals.
- **Owning context:** DealCaptureContext
- **Allowed synonyms:** Listed product
- **CML element:** `ValueObject AsxProduct`

### ASX Product Catalogue
- **Definition:** The source of listed ASX products, looked up by Product Code.
- **Owning context:** DealCaptureContext
- **Allowed synonyms:** None
- **CML element:** `Service AsxProductCatalogue`

### Lot
- **Definition:** One ASX electricity futures contract: 1 MW over the contract's Load Profile and Term. An ASX
  Futures Deal's Volume is a whole number of lots, greater than zero, expressed in MW.
- **Owning context:** DealCaptureContext
- **Allowed synonyms:** Contract
- **CML element:** `AsxFuturesDeal.volume` (`Volume` in MW)

### Price
- **Definition:** The traded price of an ASX Futures Deal in $/MWh, in steps of the minimum price movement of
  $0.01/MWh. A $300 Cap price is never negative.
- **Owning context:** DealCaptureContext
- **Allowed synonyms:** Traded price
- **CML element:** `AsxFuturesDeal.price` (`Amount` in $/MWh)

### Contracted Energy
- **Definition:** The total energy of an ASX Futures Deal: Volume (lots) x Contract Size, in MWh.
- **Owning context:** DealCaptureContext
- **Allowed synonyms:** None
- **CML element:** `AsxFuturesDeal.contractedEnergy()`

### Capture ASX Futures Deal
- **Definition:** The command that captures an ASX Futures Deal from a Product Code, Trade Direction, Price and
  Volume.
- **Owning context:** DealCaptureContext
- **Allowed synonyms:** None
- **CML element:** `CommandEvent CaptureAsxFuturesDeal`

### ASX Futures Deal Captured
- **Definition:** The domain event recording that an ASX Futures Deal was captured: its Deal Id, ASX Product,
  Trade Direction, Price, Volume and when it occurred. The first event of every ASX futures deal stream.
- **Owning context:** DealCaptureContext
- **Allowed synonyms:** None
- **CML element:** `DomainEvent AsxFuturesDealCaptured`
