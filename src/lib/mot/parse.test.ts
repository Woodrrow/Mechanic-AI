import { describe, expect, it } from "vitest";
import { normaliseForMatching, parseDefect, parseLocation, parseManualReference } from "./parse";

describe("parseManualReference", () => {
  it("reads current-format codes", () => {
    const r = parseManualReference("Nearside Front Tyre worn close to legal limit/worn on edge (5.2.3 (e))");
    expect(r.reference).toEqual({ code: "5.2.3 (e)", section: "5.2.3", format: "current" });
    expect(r.rest).toBe("Nearside Front Tyre worn close to legal limit/worn on edge");
    const sub = parseManualReference("Oil leak, but not excessive (8.4.1 (a) (i))");
    expect(sub.reference?.code).toBe("8.4.1 (a) (i)");
    expect(sub.rest).toBe("Oil leak, but not excessive");
  });

  it("reads legacy codes", () => {
    expect(parseManualReference("Nearside Front Tyre worn close to the legal limit (4.1.E.1)").reference).toEqual({
      code: "4.1.E.1",
      section: "4.1",
      format: "legacy",
    });
    expect(parseManualReference("Front brake pad(s) wearing thin (3.5.1g)").reference).toEqual({
      code: "3.5.1g",
      section: "3.5.1",
      format: "legacy",
    });
    expect(parseManualReference("Exhaust has a minor leak of exhaust gases (7.1.2)").reference?.format).toBe("legacy");
  });

  it("copes with no code", () => {
    const r = parseManualReference("Slight play in steering rack");
    expect(r.reference).toBeNull();
    expect(r.rest).toBe("Slight play in steering rack");
  });
});

describe("parseLocation", () => {
  it("strips and records the corner", () => {
    expect(parseLocation("Nearside Front Tyre worn").location).toMatchObject({ side: "nearside", position: "front", label: "Nearside front" });
    expect(parseLocation("Offside Rear Brake pad(s) wearing thin").rest).toBe("Brake pad(s) wearing thin");
    expect(parseLocation("Front Brake disc worn").location).toMatchObject({ side: null, position: "front" });
    expect(parseLocation("Oil leak").location.label).toBeNull();
    expect(parseLocation("Inner Nearside Rear Tyre worn").location.qualifiers).toEqual(["inner"]);
  });
});

describe("parseDefect", () => {
  it("assigns categories from the manual section", () => {
    expect(parseDefect("Front Brake pad(s) wearing thin (1.1.13 (a) (ii))", "ADVISORY").category).toBe("brakes");
    expect(parseDefect("Nearside Front Suspension arm ball joint has excessive play (5.3.4 (a) (i))", "MAJOR").category).toBe("suspension");
    expect(parseDefect("Nearside Front Tyre worn close to legal limit/worn on edge (5.2.3 (e))", "ADVISORY").category).toBe("wheels_tyres");
    expect(parseDefect("Oil leak, but not excessive (8.4.1 (a) (i))", "ADVISORY").category).toBe("nuisance_emissions");
    expect(parseDefect("Offside Front Headlamp aim too high (4.1.2 (a))", "MAJOR").category).toBe("lamps_electrics");
  });

  it("maps legacy sections and falls back to keywords", () => {
    expect(parseDefect("Nearside Front Tyre worn close to the legal limit (4.1.E.1)", "ADVISORY").category).toBe("wheels_tyres");
    expect(parseDefect("Front brake pad(s) wearing thin (3.5.1g)", "ADVISORY").category).toBe("brakes");
    expect(parseDefect("Exhaust has a minor leak of exhaust gases (7.1.2)", "ADVISORY").category).toBe("nuisance_emissions");
    expect(parseDefect("Slight play in steering rack", "ADVISORY").category).toBe("steering");
  });

  it("normalises defect types", () => {
    expect(parseDefect("x", "ADVISORY").type).toBe("advisory");
    expect(parseDefect("x", "MAJOR").type).toBe("major");
    expect(parseDefect("x", "MAJOR", true)).toMatchObject({ type: "dangerous", dangerous: true });
    expect(parseDefect("x", "PRS").type).toBe("prs");
    expect(parseDefect("x", "FAIL").type).toBe("fail");
    expect(parseDefect("x", undefined).type).toBe("other");
  });

  it("normalises text for matching", () => {
    expect(normaliseForMatching("Brake pad(s) wearing thin!")).toBe("brake pads wearing thin");
  });
});
