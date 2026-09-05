# Phase 1 — Garage

Scope from the brief: *"Reg-plate lookup via DVLA, VIN fallback via vPIC, vehicle stored and displayed. Nothing else. Prove the data is good before building on it."*

This ran as an unattended session, so instead of stopping at the plan I built Phase 1 under explicit assumptions and stopped there. Every assumption below is cheap to reverse; tell me which ones you want changed before Phase 2.

## Update, 5 September: keys

- **DVLA VES is not accepting new registrations.** The client stays in the codebase and switches on if a key ever arrives, but nothing depends on it.
- **DVSA MOT History is pending** (up to five working days). It is now the primary source, and it is sufficient: it carries make, model, colour, engine size, fuel, registration and manufacture dates, recall flag and the full test history. Without DVLA we lose only tax status, DVLA's own MOT flag (the app derives MOT validity from the latest DVSA pass instead), CO2, Euro status and wheelplan. None of those matter to the product.
- **Manual entry added.** A V5C-guided form (make, model, year, engine size, fuel, gearbox, colour, optional registration and VIN) that produces the same `Vehicle` with every field's provenance marked "You". It is the first tab when no lookup provider is configured, and a fallback otherwise, so the garage is never blocked on a government service.
- **Fixtures are no longer a silent default.** They appear only with `POCKET_MECHANIC_USE_FIXTURES=1`. A deployed app with no keys now offers manual entry rather than showing sample cars to real users.
- **Unconfigured providers no longer nag.** A skipped provider is a deployment fact and is left out of the user-facing warnings and source chips; it remains in the API's `providers` report and the verify script.

The action for you is unchanged: when the DVSA credentials arrive, put them in `.env.local` and run `npm run verify:apis -- --reg "<your plate>"`. Registration lookup switches on with no code change.

## What is built

- **Lookup by UK registration** (`POST /api/vehicles/lookup`): DVLA VES and DVSA MOT History queried in parallel, merged into one candidate with per-field provenance. Either source alone is enough; DVSA is the only source of the model name.
- **Lookup by VIN**: DVSA MOT-by-VIN (for UK-registered cars) plus NHTSA vPIC, merged the same way. The VIN check digit is enforced for North American VINs only, because European VINs do not use it.
- **Confirmation step**: the user sees every field with a badge saying which record it came from, and is asked only for what the free records cannot supply (gearbox always; model or year when a source was missing).
- **My Garage**: list, detail (all fields, UK tax/MOT record, a collapsible dump of exactly what each API returned) and remove. Storage is behind a `GarageStore` interface with two implementations: browser localStorage (zero config) and Supabase Postgres with anonymous auth and row-level security (`supabase/migrations`).
- **Demo mode** when no UK provider is configured: fixtures shaped like the real responses, including error plates, so the whole flow can be exercised before the government keys arrive.
- **PWA**: manifest, build-time generated icons (no image tooling in the repo), theme-aware.
- **Safety plumbing**: liability disclaimer in the shell and on the add flow; server-side rate limit on the lookup route to protect the DVLA/DVSA quotas; keys never reach the browser; registration marks never logged.
- **Tests**: 63 unit tests over plate/VIN validation, fuel/gearbox normalisation, merge precedence, each provider client's error mapping (with a fake `fetch`), the orchestrator in demo and live modes, the rate limiter and the route handler.
- **`npm run verify:apis`**: the acceptance script for the day the keys arrive. It prints each provider's raw payload next to the merged candidate.

## Where I pushed back on the brief

1. **DVLA VES does not return the model.** It returns make, year, engine capacity, fuel, colour, tax and MOT status. "2015 Ford Focus" is not obtainable from DVLA alone. The only free source of the model name is the DVSA MOT History API, so it had to come into Phase 1 rather than wait for Phase 2. The Phase 2 work (parsing the test history) is unchanged, and the raw history is already saved with the vehicle.
2. **Engine code and transmission are not available from any free source.** DVLA and DVSA give engine capacity in cc only; neither records the gearbox. vPIC has both for US filings but rarely for EU-market cars. Phase 1 therefore asks the user to confirm the gearbox, and the data model carries `engineCc` rather than an engine code. Deriving a likely engine family (e.g. 2015 Focus 1.6 petrol → 1.6 Ti-VCT) is model inference, not verified data, and belongs in Phase 3 with an explicit "inferred" label.
3. **vPIC is weak for UK cars.** It is built from US manufacturer filings. For a European VIN it typically returns the manufacturer and an error code explaining the gap. For UK cars entered by VIN the DVSA VIN endpoint is far better, so the VIN path tries that first and uses vPIC to supplement. vPIC remains the right free choice for the future US path.
4. **"Never ask what the garage can infer" has a floor.** Gearbox has to be asked once. Everything else is inferred.

## Assumptions taken (say if you want any reversed)

| Decision | What I did | Alternative I rejected |
| --- | --- | --- |
| Storage | localStorage by default, Supabase (anonymous sign-in + RLS) when configured, behind one interface | Supabase-only would have blocked running the app until a project existed |
| Auth | Supabase anonymous sessions; no signup wall in Phase 1 | Magic-link email auth. Easy to add later via `linkIdentity`, and anonymous users convert without losing data |
| Demo fixtures | Bundled and clearly labelled "demo" in the UI, used only when no UK provider is configured or `POCKET_MECHANIC_USE_FIXTURES=1` | Mixing live DVLA with fixture DVSA, which would mislead |
| Precedence on conflicts | DVLA wins for make/year/engine/fuel/colour (it is the registration authority); DVSA supplies the model | Averaging or asking the user |
| Rate limiting | In-memory, 12 lookups/min per IP, per serverless instance | Upstash/Vercel KV would be a paid or extra dependency for a problem we do not have yet |
| Fonts | System font stack | Google Fonts. Saves a request and a build-time network dependency |
| Service worker | None yet. Chrome and iOS no longer require one for install | Adding Serwist now would be scope creep; offline caching of job guides is a Phase 3 concern |
| PWA icons | Generated at build time with `next/og` from an SVG mark | Committing PNGs from a design tool |

## Open questions for you

1. **DVLA VES terms and storage.** The terms say you take on data-protection responsibility if you combine DVLA data with data that identifies a person. Storing a user's own car in their own garage is the obvious legitimate use, but please read the terms you accept at registration and confirm you are happy with (a) storing the VES payload with the vehicle and (b) the retention period. Nothing else in the app caches VES responses.
2. **DVSA quota.** Quotas are per key and set when you register. Tell me the numbers when you have them so the rate limit and any future caching can be tuned.
3. **UAT first?** DVLA offers a UAT host with fixed test plates. If you get a UAT key first, `npm run verify:apis -- --reg AA19AAA --uat` exercises it.
4. **Vercel region.** Pick London (lhr1) for the serverless functions so DVLA/DVSA round trips stay short.
5. **Anonymous users are permanent rows** in `auth.users` and count towards Supabase's free MAU allowance. Fine for now; a cleanup job for stale anonymous accounts is needed before any marketing push.

## What could and could not be verified here

The build sandbox's egress policy blocks `*.gov.uk`, `vpic.nhtsa.dot.gov` and `supabase.com`, so **no live API call was made from this session**. The clients were written against the published documentation (endpoint paths, auth flow, response fields, error envelopes), cross-checked through web search, and exercised with a fake `fetch` in tests. The exact DVSA field set and the MOT-by-VIN behaviour for cars never registered in the UK are the two places most likely to need a tweak after `npm run verify:apis` runs with real keys. That script is the real Phase 1 acceptance test.

Confirmed from documentation:

| Fact | Source |
| --- | --- |
| VES: `POST /vehicle-enquiry/v1/vehicles`, `x-api-key`, body `{registrationNumber}`; fields include make, yearOfManufacture, engineCapacity, fuelType, colour, taxStatus, motStatus, motExpiryDate, monthOfFirstRegistration; no model | DVLA developer portal |
| VES test environment plates: `AA19AAA` (200), `ER19BAD` (400) and friends | DVLA developer portal |
| MOT History v1: base `https://history.mot.api.gov.uk`, `/v1/trade/vehicles/registration/{reg}` and `/vin/{vin}`; OAuth2 client credentials at the Microsoft login tenant, scope `https://tapi.dvsa.gov.uk/.default`, plus `X-API-Key`; 60-minute tokens; per-key quotas with a 24-hour lockout | DVSA documentation |
| MOT fields: make, model, primaryColour, fuelType, engineSize, registrationDate, manufactureDate, hasOutstandingRecall, motTests[] with defects `{text, type, dangerous}`, `motTestDueDate` for new vehicles | DVSA documentation |
| vPIC: `DecodeVinValues/{vin}?format=json`, flat `Results[0]`, ErrorCode semantics (0 clean, 1 check digit, 6 incomplete, 7 not registered for US, 8 no detailed data, 14 partial), US-filing coverage | NHTSA vPIC |

## Data model for the phases ahead

`VehicleCore` is country-agnostic; UK-only facts sit under `uk`. `makeRaw`, `year`, `engineCc` and `fuel` are the fields the Phase 3 job-guide cache will key on. Raw provider payloads are kept with the vehicle so Phase 2 (MOT history) needs no extra round trip, and `provenance` records which source supplied each field so a later correction never has to guess where a value came from.

## Hindsight

- I should have started from the DVSA field list, not the DVLA one. The brief's mental model (DVLA gives you the car) is wrong in one crucial way and finding that early reshaped the phase.
- The two-store garage is the right shape but the Supabase path is untested end to end. If Supabase is the long-term home, the next session should stand up a project and run the migration before Phase 2 builds on it.
- Demo fixtures earned their keep immediately: the whole UI was built and screenshot without a single key. Keep them current with real payloads once `verify:apis` has run.
