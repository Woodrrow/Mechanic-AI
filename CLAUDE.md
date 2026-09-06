@AGENTS.md

# Pocket Mechanic — working notes

Mobile-first PWA that helps UK car owners diagnose and repair their own cars. Zero budget: free tiers only.

- Stack: Next.js 16 (App Router, Turbopack), React 19, TypeScript strict, Tailwind v4, Supabase (optional), Vitest.
- All five phases of the original brief are done: see `docs/phase-1.md` through `docs/phase-5.md`. Anything further is new scope; agree it before building.
- Job catalogue lives in `src/lib/jobs/catalogue.ts`; RED jobs must always carry a `refusal` and never a procedure. Platform siblings come from `src/lib/platforms/table.ts`, and any substitution must be shown to the user with both cars named.
- Job guides: generated offline with Ollama (`npm run guide:generate`), stored as JSON in `data/guides/`, shown only when `status: "reviewed"`. `src/lib/jobs/spec-check.ts` blocks unsourced torque, capacity and part-number figures; keep it that way. The deployed app never calls a model.
- Diagnose is deterministic: symptoms, causes and answer weights are hand-written in `src/lib/diagnose/`, and the app never calls a model at request time. OBD-II codes are decoded from the bundled SAE J2012 data; never guess at a manufacturer-specific code.
- MOT plain-English text lives in `src/lib/mot/knowledge.ts` as hand-written rules. Extend it from real advisory text, never with generated explanations, and never state torque, capacity or part-number figures.
- Vehicle data comes only from free public APIs (DVLA VES, DVSA MOT History, NHTSA vPIC). Never scrape, never assume paid data.
- Safety rules from the product brief are non-negotiable: never invent torque figures, capacities or part numbers.
- Commands: `npm run dev`, `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm run verify:apis`, `npm run guide:generate`, `npm run guide:review`.
- With no API keys, users type their car in from the V5C; registration lookup appears once DVSA or DVLA credentials exist. `POCKET_MECHANIC_USE_FIXTURES=1` serves the sample cars in `src/lib/providers/fixtures.ts` for development.
- DVLA VES is closed to new registrations (Sept 2026). DVSA MOT History is the primary source; it carries the model, which DVLA never did.
