import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { GuideRecordSchema, modelOutputJsonSchema, modelOutputSchemaFor, type GuideRecord } from "./guide-schema";
import { buildGrounding } from "./grounding";
import { checkGuide } from "./spec-check";
import { getJob, JOBS } from "./catalogue";

export const GUIDES_DIR = path.join(process.cwd(), "data/guides");
export const REFERENCE_GUIDE_PATH = path.join(GUIDES_DIR, "front-brake-pads__ford__focus__2011-2018__1596__petrol.json");

export function loadReferenceGuide(): GuideRecord {
  return GuideRecordSchema.parse(JSON.parse(readFileSync(REFERENCE_GUIDE_PATH, "utf8")));
}

/** Every committed guide, parsed. */
export function loadGuides(): GuideRecord[] {
  return readdirSync(GUIDES_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => GuideRecordSchema.parse(JSON.parse(readFileSync(path.join(GUIDES_DIR, f), "utf8"))));
}

describe("guide schema", () => {
  it("accepts every committed guide, and each names a real job", () => {
    const guides = loadGuides();
    expect(guides.length).toBeGreaterThanOrEqual(2);
    for (const guide of guides) {
      const job = getJob(guide.jobId);
      expect(job, guide.id).not.toBeNull();
      expect(guide.status, guide.id).toBe("reviewed");
      expect(guide.specCheck.ok, guide.id).toBe(true);
      expect(modelOutputSchemaFor(job!).safeParse({ scope: guide.scope, content: guide.content }).success, guide.id).toBe(true);
    }
  });

  it("emits a closed JSON Schema per job with that job's diagram keys", () => {
    const schema = modelOutputJsonSchema(JOBS["front-brake-pads"]) as {
      type: string;
      additionalProperties?: boolean;
      required: string[];
      properties: { content: { properties: { diagramLabels: { properties: Record<string, unknown> } } } };
    };
    expect(schema.type).toBe("object");
    expect(schema.additionalProperties).toBe(false);
    expect(schema.required).toEqual(["scope", "content"]);
    expect(Object.keys(schema.properties.content.properties.diagramLabels.properties).sort()).toEqual(
      ["bleedNipple", "caliper", "carrier", "disc", "guidePins", "hub", "pads"].sort(),
    );
    expect(JSON.stringify(schema)).not.toContain('"format":');

    const wipers = modelOutputJsonSchema(JOBS["wiper-blades"]) as {
      properties: { content: { properties: { diagramLabels: { properties?: Record<string, unknown> } } } };
    };
    expect(wipers.properties.content.properties.diagramLabels.properties ?? {}).toEqual({});
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
