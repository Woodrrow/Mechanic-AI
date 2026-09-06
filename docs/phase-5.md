# Phase 5 — Diagnose by symptom, plus OBD-II codes

Scope from the brief: *"Diagnose by symptom, plus optional OBD-II code input."* And from the product section: the user describes a symptom in plain English, the app narrows it through a short structured interview, and produces a ranked list of likely causes with rough cost and difficulty for each.

## What is built

- **`/garage/[id]/diagnose`**: search or browse 14 symptoms across seven categories, answer a short interview, get a ranked list of causes.
- **Symptoms in the user's words.** "Grinding when I brake", "juddering at 60", "won't start, clicks", "puddle under the car", "burning smell". Search matches aliases, so "check engine light" and "shakes at 60" both land somewhere sensible.
- **Short structured interviews**, two or three questions each, chosen because they actually separate causes. Does the pedal pulse or does the car pull? Does the noise change when you weave gently? Do the dash lights dim when you turn the key? Several questions carry a "why we ask" line so the reasoning is visible.
- **Ranked causes** with a confidence, an indicative cost of having it done, the job tier, what the part is, what it feels like when it is the culprit, a free check you can do yourself first, and a link straight to the job guide or the red refusal.
- **Explainable, not a black box.** Every cause lists the answers that pushed it up or down. A user who disagrees can see exactly why the app thinks what it thinks.
- **Your own car's evidence.** Open MOT advisories from Phase 2 raise the matching causes, weighted by how recent they are, and are quoted in the result. Grinding brakes on a car with "brake pads wearing thin" on record is not a coincidence, and the app says so.
- **OBD-II codes.** Paste codes from a cheap reader. The SAE J2012 structure is decoded (system, generic or manufacturer-specific, powertrain subsystem) and about 130 common generic codes carry their standard description, bundled as static data. Codes raise the causes they point at.
- **Two safety stops.** A soft or sinking brake pedal and an overheating engine skip the interview entirely and say stop, with what to check once it is safe. The brief's rule that confidence the user has not earned is the thing most likely to hurt them applies hardest here.
- **Tests**: 24 new, 231 total. Code shape and decoding, the refusal to guess manufacturer codes, the ranking engine on the classic diagnostic splits, MOT evidence changing the ranking, recency weighting, library integrity (every effect answer belongs to a question, every cause referenced exists, every option has an effect), search, and the API route.

## Two weightings the tests corrected

Both were real errors in the data, found by writing the test for what a mechanic would say and watching it fail:

1. **A pull to one side under braking** was scoring below general pad wear. It is the sticking-caliper signature and now outweighs it.
2. **A battery light while driving, with a slow crank**, ranked the flat battery above the alternator. The battery is flat because the alternator is not charging it. The alternator now wins, and the flat battery is scored down slightly because it is the symptom rather than the fault.

## Decisions

| Decision | What I did | Alternative rejected |
| --- | --- | --- |
| How the ranking works | Hand-written weights per answer, summed, with reasons attached | An LLM call: costs money per use, cannot be tested, and cannot show its reasoning honestly |
| Manufacturer-specific codes | Decoded structurally, described as unknowable without the maker's tool | Guessing from the number, which is how bad advice spreads |
| Unsafe symptoms | Skip the interview, say stop | Ranking causes for a failing brake system as though it were a puzzle |
| MOT evidence | Raises causes and is quoted; never the only reason | Silently boosting scores, which would look like a coincidence |
| Costs | Indicative UK ranges for having it done | Quotes, or nothing at all |
| Confidence wording | "Likely", "possible", "less likely" | Percentages, which imply a precision this does not have |

## What this is not

It is a structured way of thinking about a symptom, backed by your car's own record. It is not an inspection, and the results page says so. Every cause offers a check you can do yourself before spending anything, which is the honest thing to lead with.

## Open questions for you

1. **More symptoms.** Fourteen covers the common ground. Tell me any symptom you would expect a driver to search for that is missing.
2. **The OBD code list.** About 130 generic codes are bundled. Extending it is cheap and safe, since the descriptions are part of the public standard.
3. **Live OBD reading.** A Bluetooth dongle can be read from a browser over Web Bluetooth on Android, but not on iOS. Pasting codes works everywhere. Worth doing later, not now.

## Hindsight

- The interview questions matter far more than the scoring maths. "Does the noise change when you weave gently" separates a wheel bearing from a tyre in one answer, and no amount of weighting substitutes for asking it.
- Attaching reasons to each cause from the start made the weights debuggable. Both errors above were obvious the moment the reasons were visible.
- Symptoms that end in "stop driving" needed to be a first-class shape in the data, not a warning banner bolted on afterwards.
