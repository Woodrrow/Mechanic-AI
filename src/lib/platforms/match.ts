/**
 * The platform-sibling matcher. Given a car and a job, finds a reviewed guide
 * written for another car on the same platform when none exists for the
 * exact car. Always returns enough to tell the user exactly what happened:
 * which platform, which car the guide is for, and whether the engine differs.
 */
import type { GuideRecord } from "@/lib/jobs/guide-schema";
import { guideMatches, type GuideLookup } from "@/lib/jobs/match";
import type { JobDefinition } from "@/lib/jobs/types";
import { PLATFORMS, type Platform, type PlatformMember } from "./table";

export function normaliseModelForPlatform(model: string | null | undefined): string {
  return (model ?? "").toUpperCase().replace(/\s+/g, " ").trim();
}

export interface Membership {
  platform: Platform;
  member: PlatformMember;
}

/** Every platform generation this car belongs to (usually one, sometimes none). */
export function findMemberships(makeRaw: string, model: string | null | undefined, year: number | null): Membership[] {
  if (!model || year === null) return [];
  const make = makeRaw.toUpperCase().trim();
  const name = normaliseModelForPlatform(model);
  const out: Membership[] = [];
  for (const platform of PLATFORMS) {
    for (const member of platform.members) {
      if (member.make === make && member.model.test(name) && year >= member.yearFrom && year <= member.yearTo) {
        out.push({ platform, member });
      }
    }
  }
  return out;
}

/**
 * Memberships of a guide's scope. Matched on the midpoint of the scope's year
 * range, not on any overlap: generations meet at a boundary year, and a guide
 * for a 2012-2020 Golf Mk7 must not be treated as a Mk8 guide because both
 * ranges touch 2020.
 */
export function guideMemberships(guide: GuideRecord): Membership[] {
  const make = guide.scope.makeRaw.toUpperCase().trim();
  const name = normaliseModelForPlatform(guide.scope.modelRaw);
  const midpoint = Math.round((guide.scope.yearFrom + guide.scope.yearTo) / 2);
  const out: Membership[] = [];
  for (const platform of PLATFORMS) {
    for (const member of platform.members) {
      if (member.make === make && member.model.test(name) && midpoint >= member.yearFrom && midpoint <= member.yearTo) {
        out.push({ platform, member });
      }
    }
  }
  return out;
}

export interface SiblingMatch {
  guide: GuideRecord;
  platform: { id: string; name: string; confidence: Platform["confidence"]; note?: string };
  vehicleMember: string;
  guideMember: string;
  engineDiffers: boolean;
}

export type GuideResolution =
  | { kind: "exact"; guide: GuideRecord }
  | ({ kind: "sibling" } & SiblingMatch)
  | { kind: "none" };

export function findSiblingGuide(lookup: GuideLookup, job: JobDefinition, guides: GuideRecord[]): SiblingMatch | null {
  const vehicleMemberships = findMemberships(lookup.makeRaw, lookup.model, lookup.year);
  if (vehicleMemberships.length === 0) return null;

  const candidates: Array<SiblingMatch & { score: number }> = [];
  for (const guide of guides) {
    if (guide.jobId !== job.id || guide.status !== "reviewed") continue;
    if (guideMatches(guide, lookup)) continue; // exact matches are handled first by the caller
    for (const gm of guideMemberships(guide)) {
      const vm = vehicleMemberships.find((v) => v.platform.id === gm.platform.id);
      if (!vm) continue;
      const engineDiffers =
        guide.scope.fuel !== lookup.fuel || (guide.scope.engineCc !== null && guide.scope.engineCc !== lookup.engineCc);
      if (job.engineSensitive && engineDiffers) continue;
      let score = 0;
      if (!engineDiffers) score += 4;
      if (guide.scope.makeRaw.toUpperCase() === lookup.makeRaw.toUpperCase()) score += 2;
      if (gm.platform.confidence === "high") score += 1;
      candidates.push({
        guide,
        platform: { id: gm.platform.id, name: gm.platform.name, confidence: gm.platform.confidence, note: gm.platform.note },
        vehicleMember: vm.member.name,
        guideMember: gm.member.name,
        engineDiffers,
        score,
      });
    }
  }
  candidates.sort((a, b) => b.score - a.score || b.guide.version - a.guide.version);
  const best = candidates[0];
  if (!best) return null;
  const { score: _score, ...match } = best;
  void _score;
  return match;
}

/** Exact guide first, then a platform sibling, then nothing. */
export function resolveGuide(lookup: GuideLookup, job: JobDefinition, guides: GuideRecord[]): GuideResolution {
  const exact = guides
    .filter((g) => g.status === "reviewed" && guideMatches(g, lookup))
    .sort((a, b) => b.version - a.version)[0];
  if (exact) return { kind: "exact", guide: exact };
  const sibling = findSiblingGuide(lookup, job, guides);
  return sibling ? { kind: "sibling", ...sibling } : { kind: "none" };
}

/** The sentence the user sees. Transparency is the point. */
export function describeSibling(match: SiblingMatch, vehicleTitle: string): string {
  const years = `${match.guide.scope.yearFrom} to ${match.guide.scope.yearTo}`;
  const engine = match.engineDiffers ? " The engine differs, so anything under the bonnet may not match." : "";
  return `No guide exists for your exact car yet. This one was written for the ${match.guideMember} (${years}), which shares the ${match.platform.name} platform with your ${vehicleTitle} (${match.vehicleMember}).${engine} Check that the parts look the same before you start.`;
}
