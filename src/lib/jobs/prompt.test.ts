import { describe, expect, it } from "vitest";
import { REGISTRATION_FIXTURES } from "@/lib/providers/fixtures";
import { candidateFromUk } from "@/lib/vehicle/merge";
import { JOBS } from "./catalogue";
import { buildGrounding } from "./grounding";
import { buildUserPrompt, SYSTEM_PROMPT } from "./prompt";

const fx = REGISTRATION_FIXTURES.AB15CDE;
const vehicle = candidateFromUk({ registration: "AB15CDE", ves: fx.ves, mot: fx.mot })!;
const job = JOBS["front-brake-pads"];

describe("grounding and prompts", () => {
  it("grounds on verified vehicle facts and whitelists their numbers", () => {
    const g = buildGrounding(vehicle, job);
    expect(g.facts).toContain("Make: FORD");
    expect(g.facts).toContain("Model: FOCUS");
    expect(g.facts).toContain("Year of manufacture: 2015");
    expect(g.facts).toContain("Engine capacity: 1596 cc (1.6 litre)");
    expect(g.allowedNumbers.sort()).toEqual(["1.6", "1596", "2015"]);
    expect(g.groundedFigures).toEqual([]);
  });

  it("never leaks the owner's MOT record into the shared guide prompt", () => {
    const prompt = buildUserPrompt(job, buildGrounding(vehicle, job));
    expect(prompt).toContain("FORD");
    expect(prompt).toContain("Front brake pads");
    expect(prompt).not.toMatch(/advisory|wearing thin|MOT/i);
    expect(prompt).not.toContain("AB15CDE");
  });

  it("carries the non-negotiable safety rules", () => {
    expect(SYSTEM_PROMPT).toContain("Never state a torque specification, fluid capacity, or part number");
    expect(SYSTEM_PROMPT).toContain("Axle stands, never a jack alone");
    expect(SYSTEM_PROMPT).toContain('"value": null');
  });
});
