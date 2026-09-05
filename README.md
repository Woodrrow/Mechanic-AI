# Pocket Mechanic

A mobile-first PWA that helps UK car owners diagnose and repair their own cars at home. Built on free tiers only.

**Status: Phase 1 (My Garage).** Add a car by UK registration (or VIN), see exactly what the free public records say about it and where each fact came from, and keep it in your garage. See [`docs/phase-1.md`](docs/phase-1.md) for the plan, the decisions taken, open questions, and what the APIs can and cannot provide.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
```

With no API keys configured, users add a car by typing the details from the V5C logbook. Registration lookup switches on automatically once DVSA (or DVLA) credentials are present. To exercise the lookup UI without keys, run with `POCKET_MECHANIC_USE_FIXTURES=1`: lookups then return bundled sample vehicles shaped like the real DVLA and DVSA responses. Try `AB15 CDE`, `LK66 YHC`, `LP24 ABC`, `AA19 AAA` or `ER19 NFD`.

Other commands:

```bash
npm test             # unit tests (Vitest)
npm run lint         # ESLint
npm run typecheck    # next typegen + tsc
npm run build        # production build
npm run verify:apis -- --reg "AB12 CDE"   # hit the live APIs with your keys and print raw + merged output
```

## Configure the free data sources

Copy `.env.example` to `.env.local` and fill in what you have. Every provider is optional and the app degrades honestly (it tells the user which source was skipped).

| Provider | What it gives us | How to get access |
| --- | --- | --- |
| DVSA MOT History API (**primary**) | make, **model**, colour, engine cc, fuel, registration and manufacture dates, full MOT test history with advisories | [Register for the MOT history API](https://documentation.history.mot.api.gov.uk/mot-history-api/register). Up to five working days. You receive a client ID, client secret, API key, token URL and scope. |
| DVLA Vehicle Enquiry Service (optional) | tax status, DVLA's MOT flag, CO2, Euro status, plus make, year, engine cc, fuel and colour. Not the model. | [Register for VES](https://register-for-ves.driver-vehicle-licensing.api.gov.uk/). **Closed to new registrations as of September 2026.** The client is built and switches on if a key ever arrives. |
| Manual entry | whatever the user copies from the V5C | Always available. Used automatically when no lookup provider is configured, and offered as a fallback otherwise. |
| NHTSA vPIC | VIN decoding, strongest for US-market cars | No key. |
| Supabase (optional) | Postgres + auth so the garage syncs across devices | Free project. Enable **Anonymous sign-ins** under Authentication, then run `supabase/migrations/*.sql` in the SQL editor. Without it, the garage lives in the browser's localStorage. |

The DVLA and DVSA keys are server-side secrets and are only ever used inside `src/app/api/vehicles/lookup/route.ts`. Registration marks are never logged.

## Deploy (free)

Push to GitHub, import into Vercel (Hobby tier), add the environment variables from `.env.example`. The app is a PWA: installable from the browser menu on Android and iOS, no store required.

## Layout

```
src/app/                      routes: / (garage), /garage/add, /garage/[id], /api/vehicles/lookup, PWA manifest + icons
src/components/               UI (all client components are marked "use client")
src/lib/vehicle/              canonical Vehicle model, plate/VIN validation, merge + provenance, lookup orchestration
src/lib/providers/            one client per free API, plus demo fixtures shaped like their responses
src/lib/garage/               GarageStore interface with localStorage and Supabase implementations
supabase/migrations/          Postgres schema with row-level security
scripts/verify-apis.mts       live API acceptance script
docs/                         phase notes
```
