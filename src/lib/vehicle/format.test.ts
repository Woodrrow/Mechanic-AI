import { describe, expect, it } from "vitest";
import { engineLitres, engineSummary, motSummary, taxTone, vehicleTitle } from "./format";

const TODAY = new Date("2026-09-05T12:00:00Z");

describe("motSummary", () => {
  it("prefers the first-test due date for new cars", () => {
    expect(motSummary({ motStatus: "No details held by DVLA", motTestDueDate: "2027-04-11" }, TODAY)).toMatchObject({
      short: "First MOT due 2027-04-11",
      tone: "neutral",
    });
  });

  it("uses DVLA's flag when present", () => {
    expect(motSummary({ motStatus: "Valid", motExpiryDate: "2027-02-11" }, TODAY)).toMatchObject({
      short: "MOT Valid",
      long: "Valid · expires 2027-02-11",
      tone: "ok",
    });
    expect(motSummary({ motStatus: "Not valid" }, TODAY)?.tone).toBe("warn");
  });

  it("derives status from the DVSA expiry when DVLA is absent", () => {
    expect(motSummary({ motExpiryDate: "2027-02-11" }, TODAY)).toMatchObject({ short: "MOT valid", tone: "ok" });
    expect(motSummary({ motExpiryDate: "2026-02-11" }, TODAY)).toMatchObject({ short: "MOT expired", tone: "warn" });
  });

  it("returns null with nothing to say", () => {
    expect(motSummary(null, TODAY)).toBeNull();
    expect(motSummary({}, TODAY)).toBeNull();
  });
});

describe("taxTone / labels", () => {
  it("colours tax status", () => {
    expect(taxTone("Taxed")).toBe("ok");
    expect(taxTone("Untaxed")).toBe("warn");
    expect(taxTone("SORN")).toBe("warn");
    expect(taxTone("Not Taxed for on Road Use")).toBe("warn");
  });

  it("formats engine and title", () => {
    expect(engineLitres(1596)).toBe("1.6");
    expect(engineLitres(1968)).toBe("2.0");
    expect(engineLitres(null)).toBeNull();
    expect(vehicleTitle({ year: 2015, make: "Ford", model: "Focus" })).toBe("2015 Ford Focus");
    expect(vehicleTitle({ year: null, make: "Ford", model: null })).toBe("Ford");
    expect(engineSummary({ engineCc: 1596, fuel: "petrol", transmission: "manual" })).toBe("1.6L · Petrol · Manual");
    expect(engineSummary({ engineCc: null, fuel: "unknown", transmission: "unknown" })).toBe("");
  });
});
