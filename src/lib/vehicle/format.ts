import type { FuelType, Source, Transmission, UkVehicleDetails, VehicleCore } from "./types";

export const FUEL_LABEL: Record<FuelType, string> = {
  petrol: "Petrol",
  diesel: "Diesel",
  hybrid: "Hybrid",
  plug_in_hybrid: "Plug-in hybrid",
  electric: "Electric",
  other: "Other fuel",
  unknown: "Fuel unknown",
};

export const TRANSMISSION_LABEL: Record<Transmission, string> = {
  manual: "Manual",
  automatic: "Automatic",
  unknown: "Gearbox unknown",
};

export const SOURCE_LABEL: Record<Source, string> = {
  dvla_ves: "DVLA",
  dvsa_mot: "DVSA",
  nhtsa_vpic: "NHTSA",
  user: "You",
};

export const SOURCE_DESCRIPTION: Record<Source, string> = {
  dvla_ves: "DVLA Vehicle Enquiry Service (registration record)",
  dvsa_mot: "DVSA MOT History (vehicle and test record)",
  nhtsa_vpic: "NHTSA vPIC VIN decoder (US manufacturer filings)",
  user: "Entered by you",
};

/** "1.6" from 1596cc; "2.0" from 1968cc. */
export function engineLitres(cc: number | null): string | null {
  if (!cc) return null;
  return (Math.round(cc / 100) / 10).toFixed(1);
}

export function vehicleTitle(v: Pick<VehicleCore, "year" | "make" | "model">): string {
  return [v.year, v.make, v.model].filter(Boolean).join(" ");
}

export function engineSummary(v: Pick<VehicleCore, "engineCc" | "fuel" | "transmission">): string {
  const parts: string[] = [];
  const litres = engineLitres(v.engineCc);
  if (litres) parts.push(`${litres}L`);
  if (v.fuel !== "unknown") parts.push(FUEL_LABEL[v.fuel]);
  if (v.transmission !== "unknown") parts.push(TRANSMISSION_LABEL[v.transmission]);
  return parts.join(" · ");
}

export interface StatusSummary {
  short: string;
  long: string;
  tone: "ok" | "warn" | "neutral";
}

/**
 * MOT status from whatever is available: DVLA's status flag when we have it,
 * otherwise the DVSA test history (latest pass expiry, or the first-test due date).
 */
export function motSummary(uk: UkVehicleDetails | null | undefined, today: Date = new Date()): StatusSummary | null {
  if (!uk) return null;
  if (uk.motTestDueDate) {
    return { short: `First MOT due ${uk.motTestDueDate}`, long: `Not yet due · first test by ${uk.motTestDueDate}`, tone: "neutral" };
  }
  if (uk.motStatus) {
    const s = uk.motStatus.toLowerCase();
    const tone = s.includes("not valid") || s.includes("expired") ? "warn" : s.includes("valid") ? "ok" : "neutral";
    return {
      short: `MOT ${uk.motStatus}`,
      long: uk.motExpiryDate ? `${uk.motStatus} · expires ${uk.motExpiryDate}` : uk.motStatus,
      tone,
    };
  }
  if (uk.motExpiryDate) {
    const expired = uk.motExpiryDate < today.toISOString().slice(0, 10);
    return expired
      ? { short: "MOT expired", long: `Expired ${uk.motExpiryDate}`, tone: "warn" }
      : { short: "MOT valid", long: `Valid · expires ${uk.motExpiryDate}`, tone: "ok" };
  }
  return null;
}

export function taxTone(status: string): StatusSummary["tone"] {
  const s = status.toLowerCase();
  if (s.includes("untaxed") || s.includes("not taxed") || s.includes("sorn")) return "warn";
  if (s.includes("taxed")) return "ok";
  return "neutral";
}

/** Display names for the fields that carry provenance. */
export const FIELD_LABEL: Record<string, string> = {
  make: "Make",
  model: "Model",
  year: "Year",
  engineCc: "Engine",
  fuel: "Fuel",
  transmission: "Gearbox",
  colour: "Colour",
};

export function fieldLabel(field: string): string {
  return FIELD_LABEL[field] ?? field;
}
