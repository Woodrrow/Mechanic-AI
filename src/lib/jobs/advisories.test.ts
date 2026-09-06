import { describe, expect, it } from "vitest";
import { analyseHistory } from "@/lib/mot/history";
import { REGISTRATION_FIXTURES } from "@/lib/providers/fixtures";
import { relevantAdvisories } from "./advisories";
import { JOBS, jobForDefect } from "./catalogue";

describe("job advisories", () => {
  it("selects the owner's brake-related MOT items", () => {
    const analysis = analyseHistory(REGISTRATION_FIXTURES.AB15CDE.mot!, new Date("2026-09-05T12:00:00Z"));
    const items = relevantAdvisories(analysis, JOBS["front-brake-pads"]);
    expect(items.open.map((i) => i.defect.explanation.ruleId)).toEqual(["brakes.pads_thin"]);
    const discs = relevantAdvisories(analysis, JOBS["front-brake-discs-and-pads"]);
    expect(discs.past.every((i) => i.defect.explanation.ruleId === "brakes.disc_worn")).toBe(true);
    expect(discs.past.length).toBeGreaterThan(0);
    expect(relevantAdvisories(null, JOBS["front-brake-pads"])).toEqual({ open: [], past: [] });
  });

  it("maps MOT rules to catalogue jobs", () => {
    expect(jobForDefect("brakes.pads_thin", { position: "front" })?.id).toBe("front-brake-pads");
    expect(jobForDefect("tyres.near_limit", null)).toBeNull();
    expect(jobForDefect(null, null)).toBeNull();
  });
});
