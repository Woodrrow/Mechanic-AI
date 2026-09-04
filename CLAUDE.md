@AGENTS.md

# Pocket Mechanic — working notes

Mobile-first PWA that helps UK car owners diagnose and repair their own cars. Zero budget: free tiers only.

- Stack: Next.js 16 (App Router, Turbopack), React 19, TypeScript strict, Tailwind v4, Supabase (optional), Vitest.
- Build order is phased. Do not build beyond the current phase. See `docs/phase-1.md`.
- Vehicle data comes only from free public APIs (DVLA VES, DVSA MOT History, NHTSA vPIC). Never scrape, never assume paid data.
- Safety rules from the product brief are non-negotiable: never invent torque figures, capacities or part numbers.
- Commands: `npm run dev`, `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm run verify:apis`.
- With no API keys the lookup runs in demo mode against `src/lib/providers/fixtures.ts`.
