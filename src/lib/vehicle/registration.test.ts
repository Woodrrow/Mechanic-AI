import { describe, expect, it } from "vitest";
import {
  classifyRegistration,
  formatRegistration,
  isPlausibleRegistration,
  normaliseRegistration,
} from "./registration";

describe("normaliseRegistration", () => {
  it("upper-cases and strips everything but letters and digits", () => {
    expect(normaliseRegistration(" ab15 cde ")).toBe("AB15CDE");
    expect(normaliseRegistration("ab-15_cde")).toBe("AB15CDE");
  });
});

describe("classifyRegistration", () => {
  it("recognises every UK format", () => {
    expect(classifyRegistration("AB15CDE")).toBe("current");
    expect(classifyRegistration("A123BCD")).toBe("prefix");
    expect(classifyRegistration("ABC123A")).toBe("suffix");
    expect(classifyRegistration("ABC123")).toBe("dateless");
    expect(classifyRegistration("123ABC")).toBe("dateless");
    expect(classifyRegistration("XYZ1234")).toBe("dateless"); // Northern Ireland
  });

  it("rejects obvious typos", () => {
    expect(classifyRegistration("AB1SCDE")).toBeNull();
    expect(classifyRegistration("ABCDEFGH")).toBeNull();
    expect(isPlausibleRegistration("")).toBe(false);
    expect(isPlausibleRegistration("A")).toBe(false);
    expect(isPlausibleRegistration("AB15CDEF")).toBe(false);
  });
});

describe("formatRegistration", () => {
  it("adds the conventional space", () => {
    expect(formatRegistration("ab15cde")).toBe("AB15 CDE");
    expect(formatRegistration("A123BCD")).toBe("A123 BCD");
    expect(formatRegistration("ABC123A")).toBe("ABC 123A");
    expect(formatRegistration("ABC1234")).toBe("ABC1234");
  });
});
