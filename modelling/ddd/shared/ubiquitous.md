# Shared Context Ubiquitous Language

This glossary is the canonical language source for `SharedContext` (`modelling/ddd/shared.cml`).

Only include terms that are genuinely cross-context and stable enough for shared-kernel ownership.

## Terms

### Amount
- **Definition:** Monetary amount value with explicit unit/currency semantics.
- **Owning context:** SharedContext
- **Allowed synonyms:** Money Amount
- **CML element:** `ValueObject Amount`

### Volume
- **Definition:** Energy volume in megawatt hours (MWh), kilowatt hours (kWh), megawatts (MW) or kilowatts (kW).
- **Owning context:** SharedContext
- **Allowed synonyms:** None
- **CML element:** `ValueObject Volume`

### Term
- **Definition:** Date range abstraction spanning start/end dates and period metadata. The Term name must conform to
  standard naming conventions:
    - Calender year is in format CalYY, where YY is the 2 digit year after 2000. E.g. Cal26
    - Financial year is in format FinYY/ZZ, where YY and ZZ are successive 2 digit year after 2000. E.g. Fin22/23 (financial year 2022/2023)
    - Quarter in format QXYY, where X is the calendar year quarter (1-4) and YY is the 2 digit year after 2000. E.g. Q126 (first calendar year quarter of 2026)
    - Single month in format MmmYY, where Mmm is the month short name and YY is the 2 digit year after 2000. E.g. Apr26
    - Non-standard terms that start or end inbetween quarter boundaries. These follow the single month format. E.g. Feb26-May26.
- **Owning context:** SharedContext
- **Allowed synonyms:** None
- **CML element:** `ValueObject Term`

### Email Address
- **Definition:** Normalized contact email representation.
- **Owning context:** SharedContext
- **Allowed synonyms:** Email
- **CML element:** `ValueObject EmailAddress`

### Phone Number
- **Definition:** Normalized contact phone representation.
- **Owning context:** SharedContext
- **Allowed synonyms:** Phone
- **CML element:** `ValueObject PhoneNumber`

### ABN
- **Definition:** Australian Business Number for legal entity identification.
- **Owning context:** SharedContext
- **Allowed synonyms:** None
- **CML element:** `ValueObject ABN`

### ACN
- **Definition:** Australian Company Number for legal entity identification.
- **Owning context:** SharedContext
- **Allowed synonyms:** None
- **CML element:** `ValueObject ACN`

### Address
- **Definition:** Physical address representation with address line, suburb, state/territory, and postcode.
- **Owning context:** SharedContext
- **Allowed synonyms:** Site Address, Physical Address
- **CML element:** `ValueObject Address`

### Amount Unit
- **Definition:** The unit an Amount is quoted in: cents per kW (c/kW), dollars per MW ($/MW), cents per kWh
  (c/kWh) or dollars per MWh ($/MWh). An Amount with no unit is plain dollars.
- **Owning context:** SharedContext
- **Allowed synonyms:** None
- **CML element:** `ValueObject AmountUnit`, `enum AmountUnitValue`

### Term Span
- **Definition:** The kind of period a Term covers: a month, a quarter, a half year (January to June `JJ`,
  July to December `JD`), a calendar year, a financial year, or non-standard. The span is derived from the
  Term's dates.
- **Owning context:** SharedContext
- **Allowed synonyms:** None
- **CML element:** `ValueObject Term` (`- @TermSpan span`)

### Date Value
- **Definition:** A date and time together with the time zone it was recorded in, with its date and time
  parts.
- **Owning context:** SharedContext
- **Allowed synonyms:** None
- **CML element:** `ValueObject DateValue`

### Time Range
- **Definition:** A window of time within a day, from a start (inclusive) to an end (exclusive).
- **Owning context:** SharedContext
- **Allowed synonyms:** Time window
- **CML element:** `ValueObject TimeRange`

### Cron Schedule
- **Definition:** A recurring schedule: a Quartz cron expression (seconds first, one `?` day field) evaluated
  in a time zone, optionally bounded by a start and end date, with a human-readable description.
- **Owning context:** SharedContext
- **Allowed synonyms:** Schedule
- **CML element:** `ValueObject CronSchedule`

## Notes

- If a term is specific to one bounded context, move it out of Shared and define it in that context's glossary/CML.
- Shared terms should be referenced consistently by all consuming contexts without changing meaning.
