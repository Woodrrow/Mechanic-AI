/** Matching a stored guide to a vehicle. Pure, so it is testable without the file store. */
import type { VehicleCore } from "@/lib/vehicle/types";
import type { GuideRecord } from "./guide-schema";

export function normaliseModelName(model: string | null | undefined): string {
  return (model ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function modelTokens(model: string | null | undefined): string[] {
  return (model ?? "")
    .toUpperCase()
    .replace(/'/g, "")
    .split(/[^A-Z0-9]+/)
    .filter(Boolean);
}

/**
 * DVSA model strings usually carry trim and engine ("FOCUS ZETEC TDCI",
 * "C-MAX TITANIUM"), so a guide written for "FOCUS" must match them. The
 * guide's model tokens must be a prefix of the vehicle's.
 */
export function modelMatches(scopeModel: string, vehicleModel: string | null | undefined): boolean {
  const scope = modelTokens(scopeModel);
  const vehicle = modelTokens(vehicleModel);
  if (scope.length === 0 || vehicle.length < scope.length) return false;
  return scope.every((token, i) => vehicle[i] === token);
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
  if (!modelMatches(guide.scope.modelRaw, lookup.model)) return false;
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
