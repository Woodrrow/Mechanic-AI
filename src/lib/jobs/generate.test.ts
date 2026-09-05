import { describe, expect, it } from "vitest";
import { FixtureModel } from "@/lib/llm/fixture-model";
import { REGISTRATION_FIXTURES } from "@/lib/providers/fixtures";
import { candidateFromUk } from "@/lib/vehicle/merge";
import { JOBS } from "./catalogue";
import { generateGuide } from "./generate";
import { loadReferenceGuide } from "./guide-schema.test";

const fx = REGISTRATION_FIXTURES.AB15CDE;
const vehicle = candidateFromUk({ registration: "AB15CDE", ves: fx.ves, mot: fx.mot })!;
const job = JOBS["front-brake-pads"];
const reference = loadReferenceGuide();
const NOW = new Date("2026-09-05T15:00:00Z");

describe("generateGuide", () => {
  it("produces a draft record with provenance from a clean model output", async () => {
    const model = new FixtureModel({ scope: reference.scope, content: reference.content });
    const { record, fileName } = await generateGuide(vehicle, job, model, { now: NOW });
    expect(fileName).toBe("front-brake-pads__ford__focus__2011-2018__1596__petrol.json");
    expect(record.status).toBe("draft");
    expect(record.reviewedAt).toBeNull();
    expect(record.generatedBy.provider).toBe("fixture");
    expect(record.grounding).toContain("Model: FOCUS");
    expect(record.generatedAt).toBe(NOW.toISOString());
  });

  it("blocks a guide that invents a torque figure", async () => {
    const steps = reference.content.steps.map((s, i) => (i === 12 ? { ...s, instruction: `${s.instruction} Tighten to 28 Nm.` } : s));
    const model = new FixtureModel({ scope: reference.scope, content: { ...reference.content, steps } });
    const { record } = await generateGuide(vehicle, job, model, { now: NOW });
    expect(record.status).toBe("blocked");
    expect(record.specCheck.violations).toEqual([{ path: "content.steps[12].instruction", kind: "torque", text: "28 Nm" }]);
  });

  it("rejects output that does not fit the schema", async () => {
    const model = new FixtureModel({ scope: reference.scope, content: { ...reference.content, steps: [] } });
    await expect(generateGuide(vehicle, job, model)).rejects.toThrow();
  });
});
