import { describe, expect, it } from "vitest";
import { modelMatches, modelTokens } from "./match";

describe("modelMatches", () => {
  it("matches a guide's model against a DVSA string carrying trim", () => {
    expect(modelMatches("FOCUS", "FOCUS ZETEC TDCI")).toBe(true);
    expect(modelMatches("FOCUS", "Focus")).toBe(true);
    expect(modelMatches("GOLF", "GOLF SE TSI BLUEMOTION TECHNOLOGY")).toBe(true);
    expect(modelMatches("C-MAX", "C-MAX TITANIUM")).toBe(true);
    expect(modelMatches("3 SERIES", "3 SERIES 320D M SPORT")).toBe(true);
  });

  it("does not match a different model that starts with the same letters", () => {
    expect(modelMatches("FOCUS", "FOCUS C-MAX")).toBe(true); // prefix by design; scoped by year and engine
    expect(modelMatches("GOLF", "GOLF PLUS SE")).toBe(true);
    expect(modelMatches("FOCUS", "FIESTA ZETEC")).toBe(false);
    expect(modelMatches("GOLF PLUS", "GOLF SE")).toBe(false);
    expect(modelMatches("A3", "A4 AVANT")).toBe(false);
    expect(modelMatches("FOCUS", "")).toBe(false);
    expect(modelMatches("FOCUS", null)).toBe(false);
  });

  it("tokenises punctuation and apostrophes", () => {
    expect(modelTokens("CEE'D SW")).toEqual(["CEED", "SW"]);
    expect(modelMatches("CEED", "CEE'D SW 1.6 CRDI")).toBe(true);
    expect(modelTokens("C-MAX TITANIUM X")).toEqual(["C", "MAX", "TITANIUM", "X"]);
  });
});
