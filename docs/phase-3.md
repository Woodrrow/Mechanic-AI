# Phase 3 — Job Guide: front brake pads on one car

Scope from the brief: *"Job Guide for a single hard-coded job (front brake pads) on a single common car, end to end: safety tier, tools, steps, generated SVG, YouTube match, caching layer. Get this genuinely good before generalising."*

Decision taken with you before the phase: **Ollama, running on your machine, is the generator.** No hosted model, no API key, no running cost.

## What is built

- **`/garage/[id]/jobs/front-brake-pads`**: the guide page. Safety tier and an AMBER interstitial that must be acknowledged before anything unlocks; then tools with indicative prices, parts, the figures the reader must look up, what the part is and where it is, a labelled schematic, the steps with cautions and checkpoints, model-specific gotchas, what done correctly looks like, what to do if it does not, a matched video, and a provenance footer.
- **The owner's MOT record on top.** Brake items from Phase 2 (pads wearing thin, discs scored) are shown in a box at the top of the guide. They come from the owner's own record at render time, never from the shared guide.
- **Guide cache** (`data/guides/*.json`): one file per job and vehicle scope (make, model, year range, engine, fuel), versioned, with the grounding facts, the model used, the spec-check result and review status stored on the record. Served by `/api/guides`, which matches a car to a guide by scope. The Supabase table for this is in `supabase/migrations`; the file store proves the flow first.
- **Generation pipeline** (`npm run guide:generate`): verified vehicle facts → the in-app system prompt from the brief → Ollama with a JSON Schema so decoding is constrained to the guide shape → zod validation with one retry → the **spec check** → a draft file. The deployed app never calls a model.
- **Spec check** (`src/lib/jobs/spec-check.ts`): every number with a torque, capacity, pressure or wear-limit unit, and anything shaped like a part number, must be traceable to the grounding facts, and every entry in `figures` must have a null value unless grounded. A guide that fails is saved as `blocked` and cannot be reviewed until the text is fixed. Tool sizes such as a 7 mm hex key are allowed on purpose.
- **Review gate** (`npm run guide:review`): drafts are invisible to users until a person marks them reviewed with their name. For brake work there is a human between any model and the reader.
- **Reference guide**: `front-brake-pads__ford__focus__2011-2018__1596__petrol.json`, written by hand and marked reviewed so the whole flow works with no keys and no spend. Its `notesForReviewer` says what to verify on a real car.
- **Diagram**: a hand-drawn SVG cross-section of a sliding-caliper disc brake with numbered callouts, labelled from the guide. It shows which part is which and which bolts a pad change touches. It is explicitly schematic; no fake photorealism.
- **Video**: YouTube Data API search per guide, cached for a day, restricted to known guides so nobody can burn the free quota with arbitrary queries. Embedded through the privacy-enhanced player, which needs no key. Without a key the guide shows a search link. The caption says the video was chosen by search, not checked by us.
- **Tests**: 45 new, covering the schema and the JSON Schema handed to Ollama, the spec check (what it catches and what it deliberately allows), the reference guide passing that check, matching by scope, prompts that never leak the owner's MOT data, generation with a fixture model producing draft and blocked records, the Ollama client's request shape, retry and error messages, the YouTube client, the diagram render, and both API routes.

## Decisions

| Decision | What I did | Alternative rejected |
| --- | --- | --- |
| Where generation runs | Offline, on your machine, by script | On-demand from Vercel: it cannot reach your machine, and a hosted model costs money |
| What happens for an uncached car | An honest "no guide yet for your exact car" with the generic safety rules and tool list | Generating live, or pretending a guide exists |
| Constraining the model | JSON Schema in Ollama's `format`, then zod, then the spec check | Prompt-only JSON, which drifts |
| Figures | Listed by name with `value: null` and where to find them | Letting the model fill them in "when confident". The brief says never |
| Tool sizes | Allowed, flagged for the reviewer in the prompt | Blocking every number, which strips the useful model-specific detail |
| The reference guide | Hand-written, marked reviewed, caveats in `notesForReviewer` | Waiting for a model run before the flow could be shown |
| Storage | Committed JSON, `outputFileTracingIncludes` so Vercel ships it | Supabase now: adds setup before the flow is proven; the migration is ready |
| Owner's MOT data | Layered on at render, from the owner's record | Baked into the shared guide, which would leak one owner's car into everyone's guide |

## How to run it on your machine

1. Install Ollama, then `ollama pull qwen3:14b` (or a larger model if you have the memory; set `OLLAMA_MODEL`).
2. `npm run guide:generate -- --registration "AB15 CDE" --fixtures --force` regenerates the demo guide as a draft alongside the hand-written one (same file name, so it will overwrite: use `--out /tmp/guides` to compare instead).
3. Read the draft. Compare it with the reference guide. Note what the model got right and wrong; that is the evidence for the model choice.
4. `npm run guide:review -- --file <file> --by "Your name"` when you are happy, then commit.

For your own car once the DVSA key lands: `npm run guide:generate -- --registration "<your plate>"`.

## What I could not verify here

This sandbox cannot reach ollama.com, so no real model ran. The Ollama client is tested against a fake server with the exact request and response shapes, and the whole pipeline is tested with a fixture model. The first real run is yours; the script prints token counts, timing and the reviewer notes so you can judge the model quickly.

The YouTube key you added is not visible in this session; environment variables reach new sessions, not a container that was already running. The search client is tested against a fake response. A new session in this environment, or your own `.env.local`, exercises it live.

## Open questions for you

1. **Which model.** Tell me your machine and I will set the default. The reference guide is the yardstick: a model that gets the guide-pin drive, the piston wind-back and the fluid-reservoir step right without inventing figures is good enough for drafts.
2. **The review bar.** Right now one person's name unlocks a guide. Before anyone else uses the app, decide whether that is you alone, and whether reviewed guides should carry a "checked on a real car" flag separate from "read and edited".
3. **Move the cache to Supabase now or in Phase 4.** The file store is fine until guides are generated by more than one person.

## Hindsight

- The spec check wanted a context rule from the start. "Block every mm" also blocks "7 mm hex key", which is the single most useful model-specific fact in the guide.
- Separating the owner's MOT items from the shared guide was the important design call of the phase. Cache on the job, personalise on render.
- Writing the reference guide by hand was worth it twice: the flow could be shown immediately, and it is now the answer key for judging whatever Ollama produces.
