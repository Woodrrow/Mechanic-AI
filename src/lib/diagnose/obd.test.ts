import { describe, expect, it } from "vitest";
import { decodeCode, decodeCodes } from "./obd";
import { isPlausibleCode, normaliseCode } from "./obd-structure";

describe("code shape", () => {
  it("normalises and validates", () => {
    expect(normaliseCode(" p0300 ")).toBe("P0300");
    expect(normaliseCode("p-0300")).toBe("P0300");
    expect(isPlausibleCode("P0300")).toBe(true);
    expect(isPlausibleCode("C0035")).toBe(true);
    expect(isPlausibleCode("U0100")).toBe(true);
    expect(isPlausibleCode("P062F")).toBe(true);
    expect(isPlausibleCode("X0300")).toBe(false);
    expect(isPlausibleCode("P030")).toBe(false);
    expect(isPlausibleCode("P0300X")).toBe(false);
    expect(isPlausibleCode("P4300")).toBe(false);
  });
});

describe("decodeCode", () => {
  it("gives the standard description for a generic code", () => {
    const p0300 = decodeCode("p0300")!;
    expect(p0300).toMatchObject({ code: "P0300", system: "P", scope: "generic", referOut: false });
    expect(p0300.description).toBe("Random/multiple cylinder misfire detected");
    expect(p0300.plain).toContain("misfire");
    expect(p0300.jobIds).toContain("spark-plugs");
    expect(p0300.subsystem).toContain("ignition");
  });

  it("never guesses at a manufacturer-specific code", () => {
    const p1234 = decodeCode("P1234")!;
    expect(p1234.scope).toBe("manufacturer");
    expect(p1234.description).toBeNull();
    expect(p1234.plain).toContain("cannot tell you what it means");
    expect(p1234.advice).toContain("exact make and model");
  });

  it("decodes an unlisted generic code structurally and says so", () => {
    const p0099 = decodeCode("P0099")!;
    expect(p0099.scope).toBe("generic");
    expect(p0099.description).toBeNull();
    expect(p0099.plain).toContain("do not have this exact code");
  });

  it("refers airbag codes out", () => {
    const b0001 = decodeCode("B0001")!;
    expect(b0001.referOut).toBe(true);
    expect(b0001.jobIds).toContain("airbag-srs");
    expect(b0001.advice).toContain("Do not work on it");
  });

  it("maps chassis and network codes", () => {
    expect(decodeCode("C0035")!.description).toContain("wheel speed sensor");
    expect(decodeCode("U0100")!.description).toContain("Lost communication");
    expect(decodeCode("P0420")!.jobIds).toContain("emissions-diagnosis");
    expect(decodeCode("nonsense")).toBeNull();
  });
});

describe("decodeCodes", () => {
  it("splits a pasted list, dedupes, and reports what it could not read", () => {
    const { codes, unrecognised } = decodeCodes("P0300, p0301; P0300 BANANA U0100");
    expect(codes.map((c) => c.code)).toEqual(["P0300", "P0301", "U0100"]);
    expect(unrecognised).toEqual(["BANANA"]);
  });
});
