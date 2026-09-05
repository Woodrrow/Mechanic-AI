@AGENTS.md

# Pocket Mechanic — working notes

Mobile-first PWA that helps UK car owners diagnose and repair their own cars. Zero budget: free tiers only.

- Stack: Next.js 16 (App Router, Turbopack), React 19, TypeScript strict, Tailwind v4, Supabase (optional), Vitest.
- Build order is phased. Do not build beyond the current phase. Phases 1 to 3 are done: see `docs/phase-1.md`, `docs/phase-2.md`, `docs/phase-3.md`. Next is Phase 4 (generalise the job catalogue, platform-sibling matcher).
- Job guides: generated offline with Ollama (`npm run guide:generate`), stored as JSON in `data/guides/`, shown only when `status: "reviewed"`. `src/lib/jobs/spec-check.ts` blocks unsourced torque, capacity and part-number figures; keep it that way. The deployed app never calls a model.
- MOT plain-English text lives in `src/lib/mot/knowledge.ts` as hand-written rules. Extend it from real advisory text, never with generated explanations, and never state torque, capacity or part-number figures.
- Vehicle data comes only from free public APIs (DVLA VES, DVSA MOT History, NHTSA vPIC). Never scrape, never assume paid data.
- Safety rules from the product brief are non-negotiable: never invent torque figures, capacities or part numbers.
- Commands: `npm run dev`, `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm run verify:apis`, `npm run guide:generate`, `npm run guide:review`.
- With no API keys, users type their car in from the V5C; registration lookup appears once DVSA or DVLA credentials exist. `POCKET_MECHANIC_USE_FIXTURES=1` serves the sample cars in `src/lib/providers/fixtures.ts` for development.
- DVLA VES is closed to new registrations (Sept 2026). DVSA MOT History is the primary source; it carries the model, which DVLA never did.
