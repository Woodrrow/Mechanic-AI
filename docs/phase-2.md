# Phase 2 — Your car's history

Scope from the brief: *"Pull and parse advisories into plain English. This is the hook — get it working early so it can be shown to people."* And from the product section: parse MOT advisories into plain English, flag what has probably worsened since, and turn each one into a suggested job.

Built against the fixtures because the DVSA key was still pending. Everything here runs unchanged on the live record the day the key lands.

## What is built

- **`/garage/[id]/history`**: every MOT test on record, newest first, with result, mileage, expiry and each defect explained. Linked from the vehicle page.
- **Parsing** (`src/lib/mot/parse.ts`): DVSA defect text carries the inspection-manual reference at the end, e.g. `Nearside Front Tyre worn close to legal limit/worn on edge (5.2.3 (e))`. The parser separates the corner (nearside/offside, front/rear), the description and the code, for both the 2018+ manual and the pre-2018 codes (`4.1.E.1`, `3.5.1g`), and maps the code to a category (brakes, steering, tyres, suspension, lights, body, leaks and emissions). Text without a code falls back to keywords.
- **Plain English** (`src/lib/mot/knowledge.ts`): a hand-written rule library of about forty common advisory patterns. Each has what the part is and what the wording means, why it matters, whether it is a wear item, an urgency, and a suggested job with the GREEN/AMBER/RED tier from the brief and where the job realistically happens (home, garage, tyre shop, windscreen specialist). Unrecognised items show the tester's wording verbatim with the manual category and no invented explanation.
- **What has probably worsened** (`src/lib/mot/history.ts`): annual mileage is estimated from the odometer readings across tests. Each item open from the latest test gets a status from months elapsed and estimated miles, worded differently for wear items, one-off fixes, minor defects, fails and dangerous items. Across tests: an item not mentioned at the next test reads as probably fixed, a fail that passed the same or next day reads as repaired, and repeat mentions are counted.
- **Update from DVSA**: refetches the record through the existing lookup route and merges it into the stored vehicle, filling gaps a typed-in car left (engine size, fuel, colour) without overwriting anything the user confirmed. Disabled with an explanation while no provider is configured.
- **Storage**: `GarageStore.update` on both implementations. Fixtures gained a ten-test history for the Focus, including a legacy-format 2018 test, so the timeline, mileage estimate and clearance logic are exercised.
- **Tests**: 34 new, covering the parser on both code formats, every fixture defect mapping to a rule, tiers on the dangerous items, the "no invented figures" rule over the whole library, history analysis (ordering, mileage, open items, clearances, same-day retests, kilometre odometers), status wording, the refresh merge, and the local store.

## Decisions

| Decision | What I did | Alternative rejected |
| --- | --- | --- |
| How to make plain English | Curated rules matched on the manual code and text | An LLM paraphrase per advisory. Costs money on every view, risks inventing detail, and the advisory vocabulary is small and standardised, so rules cover it |
| Unknown items | Show the tester's words and the manual section, say we have no note | Guessing from keywords |
| "Worsened since" | Deterministic from elapsed time and mileage, worded as probability | Anything that sounds like an inspection finding |
| Clearance logic | An item is cleared if the very next test does not mention it | "Not mentioned at any later test", which hides re-appearances |
| Legal wording | Only two legal facts stated: the 1.6 mm tread minimum, and that a dangerous defect makes the car illegal to drive | Anything about driving on a failed test with a still-valid certificate, which depends on circumstances |
| Guides | Job cards say "step-by-step guide: Phase 3" | Building any guide now |

## Where the library stops

Forty rules cover the everyday advisories: pads, discs, tyres, joints, bushes, dampers, springs, wipers, bulbs, corrosion, leaks, exhaust. Rarer items fall through to the verbatim path by design. The right way to extend it is from real data: once `verify:apis` has pulled a few real records, any advisory that falls through is a candidate for a new rule. The [anonymised MOT results dataset](https://data.gov.uk/dataset/anonymised_mot_test) can rank which unmatched texts are most common nationally, so the library grows in frequency order rather than by guesswork.

## Open questions for you

1. **Tone of the status lines.** "Very likely due now" and "Check it before the next long drive" are deliberately direct. Say if you want them softer or harder.
2. **Which car to show people first.** The Focus fixture tells the full story (nine tests, one fail, repeat tyre wear). If you would rather demo a real car, the refresh button does it the moment the key is in `.env.local`.
3. **Rule additions.** Send me any real advisory text that comes back unexplained and I will add it.

## Hindsight

- The clearance rule needed a second pass. "Not mentioned at any later test" looked right until the fixture had a disc advisory in 2022 and again in 2025; "not mentioned at the next test" tells the true story.
- Rule order matters more than I expected: "anti-roll bar link ball joint has play" must be tried before the generic ball-joint rule. Worth a test per rule, which is now the case for the fixtures.
- Building the timeline before the key arrived was the right call. The parser and rules are the risky part, and they are exercised on realistic text already.
