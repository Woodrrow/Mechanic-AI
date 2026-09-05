import { describe, expect, it } from "vitest";
import { EMPTY_MANUAL_ENTRY, parseEngineSize, vehicleFromManualEntry, type ManualEntryInput } from "./manual";

const NOW = new Date("2026-09-05T12:00:00Z");

const focus: ManualEntryInput = {
  ...EMPTY_MANUAL_ENTRY,
  make: "ford",
  model: "FOCUS",
  year: "2015",
  fuel: "petrol",
  engine: "1596",
  transmission: "manual",
  colour: "blue",
  registration: "ab15 cde",
};

describe("parseEngineSize", () => {
  it("accepts cc, litres and blank", () => {
    expect(parseEngineSize("1596")).toEqual({ cc: 1596, fromLitres: false });
    expect(parseEngineSize("1.6")).toEqual({ cc: 1600, fromLitres: true });
    expect(parseEngineSize("2,0 L")).toEqual({ cc: 2000, fromLitres: true });
    expect(parseEngineSize("1968cc")).toEqual({ cc: 1968, fromLitres: false });
    expect(parseEngineSize("")).toEqual({ cc: null, fromLitres: false });
  });

  it("rejects nonsense", () => {
    expect(parseEngineSize("big")).toBeNull();
    expect(parseEngineSize("0")).toBeNull();
    expect(parseEngineSize("30")).toBeNull();
    expect(parseEngineSize("50000")).toBeNull();
  });
});

describe("vehicleFromManualEntry", () => {
  it("builds a user-sourced vehicle", () => {
    const result = vehicleFromManualEntry(focus, NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const v = result.vehicle;
    expect(v).toMatchObject({
      country: "GB",
      registration: "AB15CDE",
      vin: null,
      make: "Ford",
      makeRaw: "FORD",
      model: "Focus",
      year: 2015,
      engineCc: 1596,
      fuel: "petrol",
      transmission: "manual",
      colour: "Blue",
      uk: null,
      sources: {},
    });
    expect(v.provenance.every((p) => p.source === "user")).toBe(true);
    expect(v.provenance.map((p) => p.field).sort()).toEqual(
      ["colour", "engineCc", "fuel", "make", "model", "transmission", "year"].sort(),
    );
  });

  it("flags an engine size converted from litres", () => {
    const result = vehicleFromManualEntry({ ...focus, engine: "1.6" }, NOW);
    expect(result.ok && result.vehicle.engineCc).toBe(1600);
    expect(result.ok && result.vehicle.provenance.find((p) => p.field === "engineCc")?.note).toMatch(/litres/);
  });

  it("allows unknown engine size and gearbox", () => {
    const result = vehicleFromManualEntry({ ...focus, engine: "", transmission: "unknown", colour: "" }, NOW);
    expect(result.ok && result.vehicle.engineCc).toBeNull();
    expect(result.ok && result.vehicle.transmission).toBe("unknown");
    expect(result.ok && result.vehicle.colour).toBeNull();
  });

  it("reports every missing or malformed field at once", () => {
    const result = vehicleFromManualEntry(
      { ...EMPTY_MANUAL_ENTRY, year: "15", engine: "huge", registration: "NOTAPLATE99", vin: "TOOSHORT" },
      NOW,
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.errors).sort()).toEqual(
      ["engine", "fuel", "make", "model", "registration", "vin", "year"].sort(),
    );
    expect(result.errors.year).toContain("2027");
  });

  it("handles non-UK cars", () => {
    const us = vehicleFromManualEntry(
      { ...focus, registration: "", vin: "1FADP3F23FL123456", ukRegistered: false },
      NOW,
    );
    expect(us.ok && us.vehicle.country).toBe("US");
    const eu = vehicleFromManualEntry({ ...focus, registration: "", ukRegistered: false }, NOW);
    expect(eu.ok && eu.vehicle.country).toBe("other");
  });
});
