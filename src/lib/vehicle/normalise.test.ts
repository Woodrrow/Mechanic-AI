import { describe, expect, it } from "vitest";
import { displayMake, normaliseFuel, normaliseTransmission, parseYear, titleCase, toInt } from "./normalise";

describe("normaliseFuel", () => {
  it.each([
    ["PETROL", "petrol"],
    ["Petrol", "petrol"],
    ["Gasoline", "petrol"],
    ["DIESEL", "diesel"],
    ["HEAVY OIL", "diesel"],
    ["HYBRID ELECTRIC", "hybrid"],
    ["Hybrid Electric (Clean)", "hybrid"],
    ["ELECTRIC DIESEL", "hybrid"],
    ["ELECTRICITY", "electric"],
    ["Electric", "electric"],
    ["GAS BI-FUEL", "other"],
    ["LPG", "other"],
    [null, "unknown"],
    [undefined, "unknown"],
  ])("maps %s to %s", (raw, expected) => {
    expect(normaliseFuel(raw)).toBe(expected);
  });

  it("prefers the vPIC electrification level when present", () => {
    expect(normaliseFuel("Gasoline", "PHEV (Plug-in Hybrid Electric Vehicle)")).toBe("plug_in_hybrid");
    expect(normaliseFuel("Gasoline", "Strong HEV (Hybrid Electric Vehicle)")).toBe("hybrid");
    expect(normaliseFuel("Electric", "BEV (Battery Electric Vehicle)")).toBe("electric");
  });
});

describe("normaliseTransmission", () => {
  it("maps vPIC transmission styles", () => {
    expect(normaliseTransmission("Manual/Standard")).toBe("manual");
    expect(normaliseTransmission("Automatic")).toBe("automatic");
    expect(normaliseTransmission("Continuously Variable Transmission (CVT)")).toBe("automatic");
    expect(normaliseTransmission("Automated Manual Transmission (AMT) / Dual Clutch")).toBe("automatic");
    expect(normaliseTransmission("")).toBe("unknown");
    expect(normaliseTransmission(null)).toBe("unknown");
  });
});

describe("displayMake / titleCase", () => {
  it("styles brands sensibly", () => {
    expect(displayMake("FORD")).toBe("Ford");
    expect(displayMake("VOLKSWAGEN")).toBe("Volkswagen");
    expect(displayMake("BMW")).toBe("BMW");
    expect(displayMake("MERCEDES-BENZ")).toBe("Mercedes-Benz");
    expect(displayMake("LAND ROVER")).toBe("Land Rover");
    expect(displayMake("SEAT")).toBe("SEAT");
    expect(titleCase("FOCUS")).toBe("Focus");
    expect(titleCase("C-MAX")).toBe("C-Max");
    expect(titleCase("XC60")).toBe("XC60");
    expect(titleCase("3 SERIES")).toBe("3 Series");
  });
});

describe("parseYear / toInt", () => {
  it("extracts years from provider date formats", () => {
    expect(parseYear("2015")).toBe(2015);
    expect(parseYear("2015-03")).toBe(2015);
    expect(parseYear("2015-03-17")).toBe(2015);
    expect(parseYear(2016)).toBe(2016);
    expect(parseYear("")).toBeNull();
    expect(parseYear(undefined)).toBeNull();
  });

  it("parses engine sizes", () => {
    expect(toInt("1596")).toBe(1596);
    expect(toInt(1968)).toBe(1968);
    expect(toInt("")).toBeNull();
    expect(toInt("abc")).toBeNull();
  });
});
