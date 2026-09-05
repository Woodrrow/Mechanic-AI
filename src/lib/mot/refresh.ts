/**
 * Applies a fresh lookup to a stored vehicle: replaces the DVSA payload,
 * updates the MOT-derived UK fields, and fills any gaps the user left when
 * they typed the car in. Never overwrites a value the user confirmed.
 */
import type { Provenance, Vehicle, VehicleCandidate, VehicleCore } from "@/lib/vehicle/types";

export function mergeRefresh(vehicle: Vehicle, candidate: VehicleCandidate, now: Date = new Date()): Partial<VehicleCore> | null {
  const mot = candidate.sources.dvsaMot;
  if (mot === undefined) return null;

  const sources = { ...vehicle.sources, dvsaMot: mot, fetchedAt: now.toISOString() };
  if (candidate.sources.fixture) sources.fixture = true;
  else delete sources.fixture;

  const uk = { ...(vehicle.uk ?? {}) };
  for (const key of ["motExpiryDate", "motTestDueDate", "motTestCount", "hasOutstandingRecall", "firstRegistered"] as const) {
    const value = candidate.uk?.[key];
    if (value !== undefined) (uk as Record<string, unknown>)[key] = value;
  }

  const patch: Partial<VehicleCore> = { sources, uk };
  const provenance: Provenance[] = [...vehicle.provenance];
  const adopt = (field: "model" | "year" | "engineCc" | "colour") => {
    if (vehicle[field] === null && candidate[field] !== null) {
      (patch as Record<string, unknown>)[field] = candidate[field];
      const entry = candidate.provenance.find((p) => p.field === field);
      if (entry) provenance.push(entry);
    }
  };
  adopt("model");
  adopt("year");
  adopt("engineCc");
  adopt("colour");
  if (vehicle.fuel === "unknown" && candidate.fuel !== "unknown") {
    patch.fuel = candidate.fuel;
    const entry = candidate.provenance.find((p) => p.field === "fuel");
    if (entry) provenance.push(entry);
  }
  patch.provenance = provenance;
  return patch;
}
