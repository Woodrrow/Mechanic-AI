import { describe, expect, it } from "vitest";
import { loadReferenceGuide } from "./guide-schema.test";
import { guideFileName, guideMatches, normaliseModelName, selectGuide } from "./match";

const guide = loadReferenceGuide();
const focus = { jobId: "front-brake-pads", makeRaw: "FORD", model: "Focus", year: 2015, engineCc: 1596, fuel: "petrol" };

describe("guide matching", () => {
  it("matches the demo Focus and rejects near misses", () => {
    expect(guideMatches(guide, focus)).toBe(true);
    expect(guideMatches(guide, { ...focus, model: "FOCUS " })).toBe(true);
    expect(guideMatches(guide, { ...focus, year: 2010 })).toBe(false);
    expect(guideMatches(guide, { ...focus, year: 2019 })).toBe(false);
    expect(guideMatches(guide, { ...focus, engineCc: 1998 })).toBe(false);
    expect(guideMatches(guide, { ...focus, fuel: "diesel" })).toBe(false);
    expect(guideMatches(guide, { ...focus, makeRaw: "VOLKSWAGEN", model: "Golf" })).toBe(false);
    expect(guideMatches(guide, { ...focus, jobId: "rear-brake-pads" })).toBe(false);
    expect(guideMatches(guide, { ...focus, year: null })).toBe(false);
  });

  it("applies to any engine when the scope says so", () => {
    const anyEngine = { ...guide, scope: { ...guide.scope, engineCc: null } };
    expect(guideMatches(anyEngine, { ...focus, engineCc: 1998 })).toBe(true);
  });

  it("hides drafts unless asked and prefers reviewed, newest versions", () => {
    const draft = { ...guide, id: "draft", status: "draft" as const, version: 2 };
    expect(selectGuide([draft], focus)).toBeNull();
    expect(selectGuide([draft], focus, true)?.id).toBe("draft");
    expect(selectGuide([draft, guide], focus, true)?.id).toBe(guide.id);
    const newer = { ...guide, id: "v2", version: 2 };
    expect(selectGuide([guide, newer], focus)?.id).toBe("v2");
  });

  it("normalises names and builds stable file names", () => {
    expect(normaliseModelName("C-Max")).toBe("CMAX");
    expect(guideFileName(guide)).toBe("front-brake-pads__ford__focus__2011-2018__1596__petrol.json");
    expect(guideFileName({ jobId: "front-brake-pads", scope: { ...guide.scope, engineCc: null, makeRaw: "LAND ROVER" } })).toBe(
      "front-brake-pads__land-rover__focus__2011-2018__any__petrol.json",
    );
  });
});
