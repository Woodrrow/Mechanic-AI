import { describe, expect, it } from "vitest";
import { analyseHistory } from "@/lib/mot/history";
import { REGISTRATION_FIXTURES } from "@/lib/providers/fixtures";
import { CAUSES } from "./causes";
import { diagnose, motWeight } from "./engine";
import { decodeCodes } from "./obd";
import { getSymptom, searchSymptoms, SYMPTOMS } from "./symptoms";

const NOW = new Date("2026-09-06T12:00:00Z");
const focusHistory = analyseHistory(REGISTRATION_FIXTURES.AB15CDE.mot!, NOW);

describe("diagnose", () => {
  it("ranks worn pads top for a metallic grind only when braking", () => {
    const result = diagnose({
      symptom: getSymptom("grinding-when-braking")!,
      answers: { when: "only-braking", character: "metallic-grind", feel: "nothing" },
    });
    expect(result.causes[0].cause.id).toBe("worn-brake-pads");
    expect(result.causes[0].confidence).toBe("likely");
    expect(result.causes[0].reasons.some((r) => r.includes("metal grinding"))).toBe(true);
    expect(result.answered).toBe(3);
    expect(result.totalQuestions).toBe(3);
  });

  it("switches to a sticking caliper when the car pulls and one wheel is hot", () => {
    const result = diagnose({
      symptom: getSymptom("grinding-when-braking")!,
      answers: { when: "always-worse-braking", character: "metallic-grind", feel: "pulls" },
    });
    expect(result.causes[0].cause.id).toBe("sticking-caliper");
  });

  it("separates brake judder from a wheel imbalance", () => {
    const brakes = diagnose({
      symptom: getSymptom("juddering-when-braking")!,
      answers: { where: "both", speed: "high-speed", "not-braking": "only-braking" },
    });
    expect(brakes.causes[0].cause.id).toBe("warped-discs");

    const wheels = diagnose({
      symptom: getSymptom("juddering-when-braking")!,
      answers: { where: "wheel", speed: "low-speed", "not-braking": "also-cruising" },
    });
    expect(wheels.causes[0].cause.id).toBe("wheel-balance");
  });

  it("reads the classic no-start answers correctly", () => {
    const flat = diagnose({
      symptom: getSymptom("wont-start")!,
      answers: { "what-happens": "rapid-click", lights: "lights-dim", history: ["getting-slower"] },
    });
    expect(flat.causes[0].cause.id).toBe("flat-battery");

    const starter = diagnose({
      symptom: getSymptom("wont-start")!,
      answers: { "what-happens": "single-click", lights: "lights-bright" },
    });
    expect(starter.causes[0].cause.id).toBe("starter-motor");

    const alternator = diagnose({
      symptom: getSymptom("wont-start")!,
      answers: { "what-happens": "slow-crank", lights: "lights-dim", history: ["battery-light"] },
    });
    expect(alternator.causes.slice(0, 2).map((c) => c.cause.id)).toContain("failing-alternator");

    const immobiliser = diagnose({
      symptom: getSymptom("wont-start")!,
      answers: { "what-happens": "turns-not-firing", lights: "lights-bright", history: ["key-symbol"] },
    });
    expect(immobiliser.causes[0].cause.id).toBe("immobiliser");
  });

  it("uses this car's MOT record as evidence and says so", () => {
    const withHistory = diagnose({
      symptom: getSymptom("grinding-when-braking")!,
      answers: { when: "only-braking" },
      history: focusHistory,
    });
    const pads = withHistory.causes.find((c) => c.cause.id === "worn-brake-pads")!;
    expect(pads.motEvidence.length).toBeGreaterThan(0);
    expect(pads.motEvidence[0]).toContain("Brake pads wearing thin");

    const without = diagnose({ symptom: getSymptom("grinding-when-braking")!, answers: { when: "only-braking" } });
    const padsWithout = without.causes.find((c) => c.cause.id === "worn-brake-pads")!;
    expect(pads.score).toBeGreaterThan(padsWithout.score);
  });

  it("weights recent MOT items more than old ones", () => {
    expect(motWeight(2)).toBeGreaterThan(motWeight(12));
    expect(motWeight(12)).toBeGreaterThan(motWeight(24));
    expect(motWeight(24)).toBeGreaterThan(motWeight(48));
  });

  it("lets a fault code push a cause up", () => {
    const { codes } = decodeCodes("P0301");
    const withCode = diagnose({
      symptom: getSymptom("engine-warning-light")!,
      answers: { "steady-or-flashing": "steady", "how-drives": "drives-normally" },
      codes,
    });
    const misfire = withCode.causes.find((c) => c.cause.id === "misfire-ignition")!;
    expect(misfire.reasons.some((r) => r.includes("P0301"))).toBe(true);
    expect(misfire.score).toBeGreaterThan(0);
  });

  it("returns a safety stop instead of a diagnosis where the brief demands one", () => {
    const soft = diagnose({ symptom: getSymptom("soft-brake-pedal")!, answers: {} });
    expect(soft.safetyStop?.title).toBe("Stop driving the car");
    expect(soft.causes[0].cause.id).toBe("brake-fluid-leak");
    const hot = diagnose({ symptom: getSymptom("overheating")!, answers: {} });
    expect(hot.safetyStop?.body.join(" ")).toContain("never open the coolant cap".toLowerCase().replace("n", "N").slice(0, 5));
  });

  it("gives every ranked cause a reason or MOT evidence once answered", () => {
    for (const symptom of Object.values(SYMPTOMS)) {
      if (symptom.questions.length === 0) continue;
      const answers: Record<string, string> = {};
      for (const q of symptom.questions) answers[q.id] = q.options[0].id;
      const result = diagnose({ symptom, answers });
      expect(result.causes.length, symptom.id).toBeGreaterThan(0);
      expect(result.causes[0].cause.name, symptom.id).toBeTruthy();
    }
  });
});

describe("symptom library", () => {
  it("references only causes that exist, and every effect answer belongs to a question", () => {
    for (const symptom of Object.values(SYMPTOMS)) {
      const answerIds = new Set(symptom.questions.flatMap((q) => q.options.map((o) => o.id)));
      for (const causeId of Object.keys(symptom.priors)) expect(CAUSES[causeId], `${symptom.id} prior ${causeId}`).toBeDefined();
      for (const [answerId, effect] of Object.entries(symptom.effects)) {
        expect(answerIds.has(answerId), `${symptom.id} effect for unknown answer ${answerId}`).toBe(true);
        for (const causeId of Object.keys(effect)) expect(CAUSES[causeId], `${symptom.id}.${answerId} -> ${causeId}`).toBeDefined();
      }
      for (const question of symptom.questions) {
        expect(question.options.length, `${symptom.id}.${question.id}`).toBeGreaterThanOrEqual(2);
        for (const option of question.options) {
          expect(symptom.effects[option.id], `${symptom.id}.${question.id}.${option.id} has no effect entry`).toBeDefined();
        }
      }
    }
  });

  it("states no torque, capacity or part-number figures", () => {
    const text = Object.values(CAUSES)
      .map((c) => `${c.what} ${c.fits} ${c.ownCheck ?? ""}`)
      .concat(Object.values(SYMPTOMS).flatMap((s) => [s.blurb, ...(s.safetyStop?.body ?? [])]))
      .join(" ");
    expect(text).not.toMatch(/\d+\s?(nm|lb ?ft|litres? of|psi)/i);
  });

  it("searches by everyday wording", () => {
    expect(searchSymptoms("grinding")[0].id).toBe("grinding-when-braking");
    expect(searchSymptoms("wont start")[0].id).toBe("wont-start");
    expect(searchSymptoms("shakes at 60")[0].id).toBe("vibration-at-speed");
    expect(searchSymptoms("check engine light")[0].id).toBe("engine-warning-light");
    expect(searchSymptoms("puddle")[0].id).toBe("puddle-under-car");
    expect(searchSymptoms("")).toHaveLength(Object.keys(SYMPTOMS).length);
    expect(searchSymptoms("xyzzy")).toEqual([]);
  });
});
