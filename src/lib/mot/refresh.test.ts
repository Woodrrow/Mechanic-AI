import { describe, expect, it } from "vitest";
import { REGISTRATION_FIXTURES } from "@/lib/providers/fixtures";
import { candidateFromUk } from "@/lib/vehicle/merge";
import type { Vehicle } from "@/lib/vehicle/types";
import { mergeRefresh } from "./refresh";

const NOW = new Date("2026-09-05T12:00:00Z");

const manual: Vehicle = {
  id: "v1",
  country: "GB",
  registration: "AB15CDE",
  vin: null,
  make: "Ford",
  makeRaw: "FORD",
  model: "Focus",
  year: 2015,
  engineCc: null,
  fuel: "unknown",
  transmission: "manual",
  colour: null,
  uk: null,
  provenance: [
    { field: "make", source: "user", raw: "Ford" },
    { field: "model", source: "user", raw: "Focus" },
    { field: "transmission", source: "user", raw: "manual" },
  ],
  sources: {},
  createdAt: "2026-09-01T00:00:00Z",
  updatedAt: "2026-09-01T00:00:00Z",
};

describe("mergeRefresh", () => {
  const fx = REGISTRATION_FIXTURES.AB15CDE;
  const candidate = candidateFromUk({ registration: "AB15CDE", ves: fx.ves, mot: fx.mot, now: NOW })!;

  it("stores the DVSA payload, MOT fields, and fills gaps without touching user values", () => {
    const patch = mergeRefresh(manual, candidate, NOW)!;
    expect(patch.sources?.dvsaMot).toBe(fx.mot);
    expect(patch.sources?.fetchedAt).toBe(NOW.toISOString());
    expect(patch.uk).toMatchObject({ motExpiryDate: "2027-02-11", motTestCount: 10, hasOutstandingRecall: "No" });
    expect(patch.engineCc).toBe(1596);
    expect(patch.fuel).toBe("petrol");
    expect(patch.colour).toBe("Blue");
    expect(patch.model).toBeUndefined(); // user already set it
    expect(patch.year).toBeUndefined();
    expect(patch.transmission).toBeUndefined();
    expect(patch.provenance?.filter((p) => p.field === "engineCc")[0]?.source).toBe("dvla_ves");
  });

  it("returns null when the candidate has no DVSA payload", () => {
    const noMot = candidateFromUk({ registration: "AA19AAA", ves: REGISTRATION_FIXTURES.AA19AAA.ves })!;
    expect(mergeRefresh(manual, noMot, NOW)).toBeNull();
  });

  it("drops the fixture flag when live data replaces demo data", () => {
    const demoVehicle: Vehicle = { ...manual, sources: { fixture: true } };
    const live = { ...candidate, sources: { ...candidate.sources, fixture: undefined } };
    const patch = mergeRefresh(demoVehicle, live, NOW)!;
    expect(patch.sources?.fixture).toBeUndefined();
  });
});
