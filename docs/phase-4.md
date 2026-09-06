# Phase 4 — Generalise the catalogue, add the platform-sibling matcher

Scope from the brief: *"Generalise the job catalogue, add the platform-sibling matcher."* Plus the platform-matching section: build a lookup table, widen the search when there is no guide for the exact car, and **tell the user you have done that**.

## What is built

- **30 jobs** across six systems, up from one. Eight GREEN (oil and filter, air filter, cabin filter, fluids, spark plugs, fault codes, battery, bulbs, headlamp aim, wipers), sixteen AMBER (front and rear pads, discs, handbrake, brake hoses, drop links, shocks, track rod ends, lower arms, wheel bearings, aux belt, coolant, alternator, exhaust), and seven RED.
- **RED jobs refuse properly.** No procedure, no safety gate, no way to argue past it. Each gives specific reasons, an indicative UK price for professional work, and what you can usefully do yourself: read the codes, note the symptom, get two quotes. Airbags and pretensioners, hybrid and EV high voltage, fuel rails and injectors, structural welding, timing belts, coil springs and emissions diagnosis.
- **Platform table**: 40 platform generations, about 170 model entries, covering the VW Group (MQB, MQB Evo, MQB A0, PQ35, PQ25, NSF), Ford (Global C, C2, C1, B, B2E, EUCD), PSA (EMP2, CMP, PF1, PF2), Renault-Nissan (CMF-C/D, CMF-B, B), Toyota (TNGA-C, TNGA-B, MC), Hyundai-Kia, BMW and MINI, Mercedes MFA, Volvo SPA and CMA, the Toyota-PSA city cars, Fiat 500 and Mazda Skyactiv. Each carries a `confidence` of high or medium, and medium ones explain why in the UI.
- **Sibling matcher**: when no reviewed guide matches the exact car, a guide written for a car on the same platform generation is offered, with a banner naming the platform, the car the guide was written for, and your car's generation. Engine-sensitive jobs (oil, plugs, belts, coolant, alternator) never cross an engine boundary. Guides are scored so a same-engine, same-make, high-confidence match wins.
- **Jobs index** at `/garage/[id]/jobs`: every job grouped by system, each marked "Guide ready", "Related car" or "No guide for your car yet", with jobs your MOT record suggests pulled to the top and the car's platform named. Jobs that do not apply to your fuel type are not listed at all.
- **Four new diagrams**: engine bay, battery terminals, suspension strut corner, auxiliary belt routing. All schematic, all labelled per guide, all with captions that admit what they are.
- **Real-world model names**: DVSA records carry trim ("FOCUS ZETEC TDCI", "CEE'D SW"), so guide matching is now token-prefix based rather than exact-string.
- **Generation is generalised**: the JSON Schema handed to Ollama is built per job, with that job's diagram keys; job-specific prompt notes go into the user prompt; the generator refuses RED jobs and jobs that do not apply to the car's fuel.
- **A second reviewed guide** (wiper blades, Golf Mk7) so the sibling matcher has a real target: an Audi A3, Seat Leon, Skoda Octavia or Cupra on MQB is offered it with the banner.
- **Tests**: 39 new, 207 total. Platform table integrity (no car in two platforms in the same year, no case-insensitive regexes), membership matching, sibling selection including the engine-sensitivity rule and the draft exclusion, catalogue invariants (every RED job has a refusal and no tools, every lifting job demands axle stands, no figures anywhere, every MOT rule id exists), model-token matching, all five diagrams, and both API routes.

## The bug the tests caught

Generations meet at a boundary year. The Golf Mk7 runs 2012 to 2020 on MQB and the Mk8 runs 2020 to 2025 on MQB Evo, so a guide scoped 2012 to 2020 overlapped both and could have been offered to a Mk8. Guide scopes are now matched on the midpoint of their year range, not on any overlap.

## Decisions

| Decision | What I did | Alternative rejected |
| --- | --- | --- |
| Platform data | Hand-curated table in code, with confidence and notes | Scraping a parts catalogue: against the brief and the licences |
| Engine-sensitive jobs | Never cross an engine boundary, even within a platform | Offering with a warning: an oil filter in the wrong place is a waste of an afternoon at best |
| Boundary years | Match a guide on its scope midpoint | Any overlap, which crosses generations |
| Jobs that do not apply | Filtered out of the list entirely | Showing them greyed out, which is noise on every petrol car |
| RED jobs | Listed, with a refusal page | Hidden, which leaves the user to search elsewhere with no warning |
| Model matching | Token prefix, so "FOCUS" matches "FOCUS ZETEC TDCI" | Exact match, which fails on almost every real DVSA record |
| Diagram labels | Per-job schema keys, model fills them in or returns null | One shared label set, which would force brake words onto a battery diagram |

## Open questions for you

1. **Which jobs to generate first.** The catalogue is 23 guideable jobs; the demo Focus has two guides. Generating the top five for your own car once the DVSA key lands is the fastest way to judge the model.
2. **Platform additions.** The table covers the common UK fleet but not everything. Tell me any car it misses and I will add the generation.
3. **Medium-confidence platforms.** BMW, Mercedes and MINI are matched on badge strings, which is the least certain part of the table. If you would rather they were left out until verified, say so.

## Hindsight

- The platform table wanted `confidence` from the first line, not as an afterthought. "These share a platform" is a much stronger claim for MQB than for Mazda's Skyactiv, and the UI should say so.
- Putting the fuel check before the tier check matters more than it looks: without it, every petrol car was shown a hybrid high-voltage refusal it could never need.
- Writing the second guide by hand was the only way to test the matcher honestly. A synthetic fixture would have matched whatever the matcher happened to do.
