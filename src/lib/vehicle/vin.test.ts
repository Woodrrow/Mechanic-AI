import { describe, expect, it } from "vitest";
import { US_FOCUS_VIN } from "@/lib/providers/fixtures";
import { isPlausibleVin, normaliseVin, vinCheckDigit, vinCheckDigitValid, vinModelYearHint, vinRegion } from "./vin";

describe("vin", () => {
  it("normalises and validates shape", () => {
    expect(normaliseVin(" wf0dxxgcbdfe12345 ")).toBe("WF0DXXGCBDFE12345");
    expect(isPlausibleVin("WF0DXXGCBDFE12345")).toBe(true);
    expect(isPlausibleVin("WF0DXXGCBDFE1234")).toBe(false);
    expect(isPlausibleVin("WF0DXXGCBDFE1234O")).toBe(false); // letter O
  });

  it("classifies the region from the first character", () => {
    expect(vinRegion("1FADP3F27FL123456")).toBe("north_america");
    expect(vinRegion("WF0DXXGCBDFE12345")).toBe("europe");
    expect(vinRegion("JTDKN3DU0A0123456")).toBe("asia");
  });

  it("computes the North American check digit", () => {
    // Widely published example VIN whose check digit is X.
    expect(vinCheckDigit("11111111111111111")).toBe("1");
    expect(vinCheckDigitValid("11111111111111111")).toBe(true);
    expect(vinCheckDigitValid(US_FOCUS_VIN)).toBe(true);
    expect(vinCheckDigitValid(US_FOCUS_VIN.slice(0, 8) + "0" + US_FOCUS_VIN.slice(9))).toBe(
      US_FOCUS_VIN.charAt(8) === "0",
    );
  });

  it("gives ambiguous model-year hints", () => {
    expect(vinModelYearHint("1FADP3F27FL123456")).toEqual([1985, 2015]);
    expect(vinModelYearHint("WF0DXXGCBDFE12345")).toEqual([1983, 2013]);
  });
});
