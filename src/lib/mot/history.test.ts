import { describe, expect, it } from "vitest";
import { REGISTRATION_FIXTURES } from "@/lib/providers/fixtures";
import { analyseHistory, statusFor } from "./history";
import { parseTest } from "./history";

const NOW = new Date("2026-09-05T12:00:00Z");
const focus = REGISTRATION_FIXTURES.AB15CDE.mot!;
const golf = REGISTRATION_FIXTURES.LK66YHC.mot!;

describe("analyseHistory", () => {
  const analysis = analyseHistory(focus, NOW)!;

  it("orders tests newest first and estimates mileage", () => {
    expect(analysis.testCount).toBe(10);
    expect(analysis.tests[0].completedDate.startsWith("2026-02-12")).toBe(true);
    expect(analysis.firstTestDate?.startsWith("2018-03-09")).toBe(true);
    expect(analysis.latestMileage).toBe(84210);
    expect(analysis.milesPerYear).toBeGreaterThan(7000);
    expect(analysis.milesPerYear).toBeLessThan(8500);
  });

  it("lists the latest test's advisories as open, most urgent first", () => {
    expect(analysis.openItems.map((i) => i.defect.explanation.ruleId)).toEqual([
      "tyres.near_limit",
      "brakes.pads_thin",
      "nuisance.oil_leak",
    ]);
    const tyre = analysis.openItems[0];
    expect(tyre.monthsSince).toBeGreaterThan(6);
    expect(tyre.estimatedMilesSince).toBeGreaterThan(3000);
    expect(tyre.status.tone).toBe("danger");
    expect(tyre.timesNoted).toBe(2); // same corner flagged in 2018 as well
    expect(tyre.firstNoted.startsWith("2018-03-09")).toBe(true);
    const pads = analysis.openItems[1];
    expect(pads.status).toMatchObject({ tone: "warn" });
    expect(pads.status.text).toMatch(/check soon/);
  });

  it("treats items not mentioned at the next test as cleared", () => {
    const disc = analysis.resolvedItems.filter((r) => r.defect.explanation.ruleId === "brakes.disc_worn");
    expect(disc.map((r) => r.notedAt.slice(0, 4)).sort()).toEqual(["2022", "2025"]);
    expect(disc.find((r) => r.notedAt.startsWith("2025"))?.clearedAt.startsWith("2026-02-12")).toBe(true);
    const headlamp = analysis.resolvedItems.find((r) => r.defect.explanation.ruleId === "lamps.headlamp_aim");
    expect(headlamp?.sameDay).toBe(true);
    expect(headlamp?.defect.type).toBe("major");
  });

  it("handles a fail cleared the next day and a car with no tests", () => {
    const g = analyseHistory(golf, NOW)!;
    const joint = g.resolvedItems.filter((r) => r.defect.explanation.ruleId === "suspension.joint");
    expect(joint).toHaveLength(2);
    expect(joint[0].sameDay).toBe(false);
    expect(joint[0].clearedAt.startsWith("2025-01-19")).toBe(true);

    const yaris = analyseHistory(REGISTRATION_FIXTURES.LP24ABC.mot!, NOW)!;
    expect(yaris.testCount).toBe(0);
    expect(yaris.openItems).toEqual([]);
    expect(yaris.milesPerYear).toBeNull();
    expect(analyseHistory(undefined, NOW)).toBeNull();
  });

  it("converts kilometre odometers and ignores unreadable ones", () => {
    const km = parseTest({ completedDate: "2025-01-01T00:00:00Z", testResult: "PASSED", odometerValue: "100000", odometerUnit: "KM", odometerResultType: "READ" });
    expect(km.odometerMiles).toBe(62137);
    const unreadable = parseTest({ completedDate: "2025-01-01T00:00:00Z", testResult: "PASSED", odometerValue: "0", odometerResultType: "UNREADABLE" });
    expect(unreadable.odometerMiles).toBeNull();
  });
});

describe("statusFor", () => {
  const base = analyseHistory(focus, NOW)!.openItems[1].defect; // pads
  it("escalates wear items with time", () => {
    expect(statusFor(base, 1, null).tone).toBe("neutral");
    expect(statusFor(base, 5, 3000).tone).toBe("warn");
    expect(statusFor(base, 10, 6000)).toMatchObject({ tone: "danger" });
    expect(statusFor(base, 10, 6000).text).toContain("6,000 miles");
  });

  it("is blunt about dangerous and failed items", () => {
    expect(statusFor({ ...base, type: "dangerous" }, 1, null).text).toMatch(/illegal to drive/);
    expect(statusFor({ ...base, type: "major" }, 3, null).tone).toBe("danger");
  });
});
