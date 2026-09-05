/**
 * Turns a DVSA MOT record into "your car's history": explained defects per
 * test, an annual-mileage estimate, what is still open from the latest test
 * and how it has probably moved on, and what earlier tests raised that later
 * tests did not mention again.
 */
import type { MotTest, MotVehicle } from "@/lib/providers/dvsa-mot";
import { explainDefect } from "./knowledge";
import { normaliseForMatching, parseDefect } from "./parse";
import type {
  ExplainedDefect,
  HistoryAnalysis,
  ItemStatus,
  OpenItem,
  ParsedTest,
  ResolvedItem,
} from "./types";

const KM_TO_MILES = 0.621371;
const DAYS_PER_MONTH = 30.44;

export function defectKey(defect: ExplainedDefect | Omit<ExplainedDefect, "key">): string {
  const corner = `${defect.location.side ?? ""}:${defect.location.position ?? ""}`;
  return defect.explanation.ruleId
    ? `${defect.explanation.ruleId}@${corner}`
    : `text:${normaliseForMatching(defect.text || defect.raw)}@${corner}`;
}

function parseOdometer(test: MotTest): { miles: number | null; raw: string | null } {
  if (test.odometerValue === undefined || test.odometerValue === null) return { miles: null, raw: null };
  const raw = String(test.odometerValue);
  if (test.odometerResultType && test.odometerResultType.toUpperCase() !== "READ") return { miles: null, raw };
  const n = Number.parseInt(raw.replace(/[^0-9]/g, ""), 10);
  if (!Number.isFinite(n)) return { miles: null, raw };
  const km = (test.odometerUnit ?? "MI").toUpperCase().startsWith("K");
  return { miles: Math.round(km ? n * KM_TO_MILES : n), raw: `${n.toLocaleString("en-GB")} ${km ? "km" : "miles"}` };
}

export function parseTest(test: MotTest): ParsedTest {
  const odo = parseOdometer(test);
  return {
    id: test.motTestNumber ?? test.completedDate,
    completedDate: test.completedDate,
    result: test.testResult.toUpperCase() === "PASSED" ? "passed" : "failed",
    expiryDate: test.expiryDate ?? null,
    odometerMiles: odo.miles,
    odometerRaw: odo.raw,
    defects: (test.defects ?? []).map((d) => {
      const parsed = parseDefect(d.text, d.type, d.dangerous);
      const explanation = explainDefect(parsed);
      const partial = { ...parsed, explanation };
      return { ...partial, key: defectKey(partial) };
    }),
  };
}

function monthsBetween(from: string, to: Date): number {
  return Math.max(0, (to.getTime() - Date.parse(from)) / (DAYS_PER_MONTH * 86_400_000));
}

function sameCalendarDay(a: string, b: string): boolean {
  return a.slice(0, 10) === b.slice(0, 10);
}

function describeAgo(months: number): string {
  const m = Math.round(months);
  if (m <= 0) return "at the last test";
  if (m === 1) return "a month ago";
  if (m < 24) return `${m} months ago`;
  const years = Math.floor(m / 12);
  return years === 1 ? "over a year ago" : `about ${years} years ago`;
}

export function statusFor(defect: ExplainedDefect, monthsSince: number, milesSince: number | null): ItemStatus {
  const ago = describeAgo(monthsSince);
  const miles = milesSince ? ` and roughly ${milesSince.toLocaleString("en-GB")} miles` : "";
  const m = Math.round(monthsSince);

  if (defect.type === "dangerous") {
    return { text: "Marked dangerous at the test. It is illegal to drive the car until this is fixed.", tone: "danger" };
  }
  if (defect.type === "major" || defect.type === "fail") {
    return {
      text: `The car failed on this ${ago}. If it has not been repaired since, deal with it before anything else.`,
      tone: "danger",
    };
  }
  if (defect.type === "minor") {
    return { text: `A minor defect ${ago}: it passed, but this should have been fixed straight away.`, tone: "warn" };
  }
  const { urgency, wearItem } = defect.explanation;
  if (urgency === "now") {
    return {
      text: `Already close to the limit ${ago}${miles}. Check it before the next long drive.`,
      tone: m >= 1 ? "danger" : "warn",
    };
  }
  if (urgency === "soon") {
    if (!wearItem) {
      return { text: `Noted ${ago}. If it was not fixed after the test, it still needs doing.`, tone: "warn" };
    }
    if (m >= 9) return { text: `Noted ${ago}${miles}. Very likely due now.`, tone: "danger" };
    if (m >= 4) return { text: `Noted ${ago}${miles}. Probably closer to the limit; check soon.`, tone: "warn" };
    return { text: `Noted ${ago}. Keep an eye on it.`, tone: "neutral" };
  }
  if (urgency === "monitor") {
    return { text: `Noted ${ago}. Check it has not spread or got worse.`, tone: m >= 12 ? "warn" : "neutral" };
  }
  return { text: `Noted ${ago}.`, tone: "neutral" };
}

const URGENCY_RANK: Record<string, number> = { dangerous: 0, fail: 1, major: 1, minor: 2 };
const EXPLANATION_RANK: Record<string, number> = { now: 3, soon: 4, monitor: 5, info: 6 };

function rank(item: OpenItem): number {
  return URGENCY_RANK[item.defect.type] ?? EXPLANATION_RANK[item.defect.explanation.urgency] ?? 7;
}

export function analyseHistory(mot: MotVehicle | null | undefined, now: Date = new Date()): HistoryAnalysis | null {
  if (!mot) return null;
  const tests = (mot.motTests ?? [])
    .map(parseTest)
    .sort((a, b) => b.completedDate.localeCompare(a.completedDate));

  const readings = tests.filter((t) => t.odometerMiles !== null) as Array<ParsedTest & { odometerMiles: number }>;
  const latestMileage = readings[0]?.odometerMiles ?? null;
  let milesPerYear: number | null = null;
  if (readings.length >= 2) {
    const newest = readings[0];
    const oldest = readings[readings.length - 1];
    const years = (Date.parse(newest.completedDate) - Date.parse(oldest.completedDate)) / (365.25 * 86_400_000);
    if (years >= 0.75 && newest.odometerMiles > oldest.odometerMiles) {
      milesPerYear = Math.round((newest.odometerMiles - oldest.odometerMiles) / years / 100) * 100;
    }
  }

  const latestTest = tests[0] ?? null;
  const openItems: OpenItem[] = [];
  const resolvedItems: ResolvedItem[] = [];

  const occurrences = new Map<string, string[]>();
  for (const test of tests) {
    for (const defect of test.defects) {
      const dates = occurrences.get(defect.key) ?? [];
      dates.push(test.completedDate);
      occurrences.set(defect.key, dates);
    }
  }

  tests.forEach((test, index) => {
    const newer = tests.slice(0, index);
    for (const defect of test.defects) {
      if (defect.type === "prs") {
        resolvedItems.push({ defect, notedAt: test.completedDate, clearedAt: test.completedDate, sameDay: true, atStation: true });
        continue;
      }
      if (index === 0) {
        const monthsSince = monthsBetween(test.completedDate, now);
        const estimatedMilesSince = milesPerYear ? Math.round(((milesPerYear * monthsSince) / 12) / 100) * 100 : null;
        const dates = occurrences.get(defect.key) ?? [test.completedDate];
        openItems.push({
          defect,
          test,
          monthsSince,
          estimatedMilesSince,
          timesNoted: dates.length,
          firstNoted: dates[dates.length - 1],
          status: statusFor(defect, monthsSince, estimatedMilesSince),
        });
        continue;
      }
      const next = newer[newer.length - 1];
      const mentionedAtNext = next.defects.some((d) => d.key === defect.key);
      if (!mentionedAtNext) {
        resolvedItems.push({
          defect,
          notedAt: test.completedDate,
          clearedAt: next.completedDate,
          sameDay: sameCalendarDay(test.completedDate, next.completedDate),
          atStation: false,
        });
      }
    }
  });

  openItems.sort((a, b) => rank(a) - rank(b) || a.defect.category.localeCompare(b.defect.category));
  resolvedItems.sort((a, b) => b.notedAt.localeCompare(a.notedAt));

  return {
    tests,
    testCount: tests.length,
    firstTestDate: tests.length ? tests[tests.length - 1].completedDate : null,
    latestTest,
    latestMileage,
    milesPerYear,
    openItems,
    resolvedItems,
  };
}
