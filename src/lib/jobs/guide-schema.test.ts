import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { GuideRecordSchema, ModelGuideOutputSchema, modelOutputJsonSchema } from "./guide-schema";
import { buildGrounding } from "./grounding";
import { checkGuide } from "./spec-check";
import { JOBS } from "./catalogue";

export const REFERENCE_GUIDE_PATH = path.join(process.cwd(), "data/guides/front-brake-pads__ford__focus__2011-2018__1596__petrol.json");

export function loadReferenceGuide() {
  return GuideRecordSchema.parse(JSON.parse(readFileSync(REFERENCE_GUIDE_PATH, "utf8")));
}

describe("guide schema", () => {
  it("accepts the committed reference guide", () => {
    const guide = loadReferenceGuide();
    expect(guide.status).toBe("reviewed");
    expect(guide.content.steps.length).toBeGreaterThanOrEqual(10);
    expect(ModelGuideOutputSchema.safeParse({ scope: guide.scope, content: guide.content }).success).toBe(true);
  });

  it("emits a closed JSON Schema for the model", () => {
    const schema = modelOutputJsonSchema() as { type: string; additionalProperties?: boolean; properties: Record<string, unknown>; required: string[] };
    expect(schema.type).toBe("object");
    expect(schema.additionalProperties).toBe(false);
    expect(schema.required).toEqual(["scope", "content"]);
    expect(JSON.stringify(schema)).not.toContain('"format":'); // nothing Ollama's grammar cannot express
  });

  it("the reference guide states no unsourced figures", () => {
    const guide = loadReferenceGuide();
    const grounding = buildGrounding(
      {
        country: "GB",
        registration: "AB15CDE",
        vin: null,
        make: "Ford",
        makeRaw: "FORD",
        model: "Focus",
        year: 2015,
        engineCc: 1596,
        fuel: "petrol",
        transmission: "unknown",
        colour: null,
        uk: null,
        provenance: [],
        sources: {},
      },
      JOBS["front-brake-pads"],
    );
    const result = checkGuide({ scope: guide.scope, content: guide.content }, { allowedNumbers: grounding.allowedNumbers, groundedFigures: [] });
    expect(result.violations).toEqual([]);
    expect(guide.content.figures.every((f) => f.value === null)).toBe(true);
  });
});
