import { describe, expect, it } from "vitest";
import { REGISTRATION_FIXTURES, US_FOCUS_VIN, VIN_FIXTURES } from "@/lib/providers/fixtures";
import { decodeVpicRow } from "@/lib/providers/nhtsa-vpic";
import { candidateFromUk, candidateFromVpic, supplementWithVpic, TRANSMISSION_WARNING } from "./merge";

const focus = REGISTRATION_FIXTURES.AB15CDE;
const yaris = REGISTRATION_FIXTURES.LP24ABC;

describe("candidateFromUk", () => {
  it("merges DVLA and DVSA with DVLA taking precedence and DVSA supplying the model", () => {
    const c = candidateFromUk({ registration: "AB15CDE", ves: focus.ves, mot: focus.mot });
    expect(c).not.toBeNull();
    expect(c!.make).toBe("Ford");
    expect(c!.makeRaw).toBe("FORD");
    expect(c!.model).toBe("Focus");
    expect(c!.year).toBe(2015);
    expect(c!.engineCc).toBe(1596);
    expect(c!.fuel).toBe("petrol");
    expect(c!.colour).toBe("Blue");
    expect(c!.transmission).toBe("unknown");
    expect(c!.needsConfirmation).toEqual(["transmission"]);
    expect(c!.warnings).toContain(TRANSMISSION_WARNING);
    expect(c!.provenance.find((p) => p.field === "model")?.source).toBe("dvsa_mot");
    expect(c!.provenance.find((p) => p.field === "year")?.source).toBe("dvla_ves");
    expect(c!.uk?.motTestCount).toBe(4);
    expect(c!.uk?.motExpiryDate).toBe("2027-02-11");
  });

  it("falls back to DVSA for year, engine and fuel when DVLA is missing", () => {
    const c = candidateFromUk({ registration: "AB15CDE", mot: focus.mot });
    expect(c!.year).toBe(2015);
    expect(c!.engineCc).toBe(1596);
    expect(c!.fuel).toBe("petrol");
    expect(c!.colour).toBe("Blue");
    expect(c!.provenance.find((p) => p.field === "year")?.source).toBe("dvsa_mot");
    expect(c!.uk?.motExpiryDate).toBe("2027-02-11"); // derived from the latest pass
  });

  it("asks for the model when only DVLA answered", () => {
    const c = candidateFromUk({ registration: "AA19AAA", ves: REGISTRATION_FIXTURES.AA19AAA.ves });
    expect(c!.model).toBeNull();
    expect(c!.needsConfirmation).toContain("model");
    expect(c!.warnings.some((w) => w.includes("DVLA does not publish model names"))).toBe(true);
  });

  it("handles the new-vehicle DVSA shape", () => {
    const c = candidateFromUk({ registration: "LP24ABC", ves: yaris.ves, mot: yaris.mot });
    expect(c!.model).toBe("Yaris");
    expect(c!.fuel).toBe("hybrid");
    expect(c!.uk?.motTestDueDate).toBe("2027-04-11");
    expect(c!.uk?.motTestCount).toBe(0);
  });

  it("uses first-registration year as a flagged fallback", () => {
    const c = candidateFromUk({
      registration: "AB15CDE",
      mot: { registration: "AB15CDE", make: "FORD", model: "FOCUS", registrationDate: "2015-03-17" },
    });
    expect(c!.year).toBe(2015);
    expect(c!.needsConfirmation).toContain("year");
    expect(c!.provenance.find((p) => p.field === "year")?.note).toMatch(/first registration/);
  });

  it("returns null with nothing to go on", () => {
    expect(candidateFromUk({ registration: "AB15CDE" })).toBeNull();
    expect(candidateFromUk({ registration: "AB15CDE", mot: { registration: "AB15CDE" } })).toBeNull();
  });
});

describe("candidateFromVpic", () => {
  it("builds a US candidate from a clean decode", () => {
    const decoded = decodeVpicRow(VIN_FIXTURES[US_FOCUS_VIN].vpic!, US_FOCUS_VIN);
    const c = candidateFromVpic(decoded);
    expect(c!.country).toBe("US");
    expect(c!.make).toBe("Ford");
    expect(c!.model).toBe("Focus");
    expect(c!.year).toBe(2015);
    expect(c!.engineCc).toBe(2000);
    expect(c!.fuel).toBe("petrol");
    expect(c!.needsConfirmation).toEqual(["transmission"]);
    expect(c!.provenance.find((p) => p.field === "year")?.note).toMatch(/Model year/);
  });

  it("explains a thin European decode", () => {
    const eu = "WF0DXXGCBDFE12345";
    const decoded = decodeVpicRow(VIN_FIXTURES[eu].vpic!, eu);
    const c = candidateFromVpic(decoded);
    expect(c!.country).toBe("other");
    expect(c!.model).toBeNull();
    expect(c!.needsConfirmation).toEqual(expect.arrayContaining(["model", "year", "transmission"]));
    expect(c!.warnings.some((w) => w.includes("US manufacturer filings"))).toBe(true);
    expect(c!.warnings.some((w) => w.startsWith("vPIC note:"))).toBe(true);
  });
});

describe("supplementWithVpic", () => {
  it("fills the gearbox from vPIC and clears the confirmation prompt", () => {
    const base = candidateFromUk({ registration: "AB15CDE", ves: focus.ves, mot: focus.mot })!;
    const decoded = decodeVpicRow({ ...VIN_FIXTURES[US_FOCUS_VIN].vpic!, TransmissionStyle: "Manual/Standard" }, US_FOCUS_VIN);
    const c = supplementWithVpic(base, decoded);
    expect(c.transmission).toBe("manual");
    expect(c.needsConfirmation).not.toContain("transmission");
    expect(c.warnings).not.toContain(TRANSMISSION_WARNING);
    expect(c.sources.nhtsaVpic).toBeDefined();
    expect(base.transmission).toBe("unknown"); // input not mutated
  });
});
