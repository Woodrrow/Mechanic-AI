import type { FuelType, Source, Transmission, VehicleCore } from "./types";

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
