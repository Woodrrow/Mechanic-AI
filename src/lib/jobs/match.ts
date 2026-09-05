/** Matching a stored guide to a vehicle. Pure, so it is testable without the file store. */
import type { VehicleCore } from "@/lib/vehicle/types";
import type { GuideRecord } from "./guide-schema";

export function normaliseModelName(model: string | null | undefined): string {
  return (model ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export interface GuideLookup {
  jobId: string;
  makeRaw: string;
  model: string | null;
  year: number | null;
  engineCc: number | null;
  fuel: string;
}

export function lookupFromVehicle(vehicle: VehicleCore, jobId: string): GuideLookup {
  return {
    jobId,
    makeRaw: vehicle.makeRaw,
    model: vehicle.model,
    year: vehicle.year,
    engineCc: vehicle.engineCc,
    fuel: vehicle.fuel,
  };
}

export function guideMatches(guide: GuideRecord, lookup: GuideLookup): boolean {
  if (guide.jobId !== lookup.jobId) return false;
  if (guide.scope.makeRaw.toUpperCase() !== lookup.makeRaw.toUpperCase()) return false;
  if (normaliseModelName(guide.scope.modelRaw) !== normaliseModelName(lookup.model)) return false;
  if (lookup.year === null || lookup.year < guide.scope.yearFrom || lookup.year > guide.scope.yearTo) return false;
  if (guide.scope.engineCc !== null && guide.scope.engineCc !== lookup.engineCc) return false;
  if (guide.scope.fuel !== lookup.fuel) return false;
  return true;
}

export function selectGuide(guides: GuideRecord[], lookup: GuideLookup, includeDrafts = false): GuideRecord | null {
  const candidates = guides.filter((g) => guideMatches(g, lookup) && (includeDrafts || g.status === "reviewed"));
  // Prefer reviewed, then the newest version.
  candidates.sort((a, b) => {
    if (a.status !== b.status) return a.status === "reviewed" ? -1 : 1;
    return b.version - a.version || b.generatedAt.localeCompare(a.generatedAt);
  });
  return candidates[0] ?? null;
}

export function guideFileName(guide: Pick<GuideRecord, "jobId" | "scope">): string {
  const s = guide.scope;
  const slug = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${slug(guide.jobId)}__${slug(s.makeRaw)}__${slug(s.modelRaw)}__${s.yearFrom}-${s.yearTo}__${s.engineCc ?? "any"}__${s.fuel}.json`;
}
