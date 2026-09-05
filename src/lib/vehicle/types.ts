/**
 * The canonical vehicle model. Country-agnostic on purpose: UK-specific data
 * lives under `uk`, and a US/EU path can add its own block later without
 * touching the core fields the rest of the app keys on.
 */

export type Source = "dvla_ves" | "dvsa_mot" | "nhtsa_vpic" | "user";

export type Country = "GB" | "US" | "other";

export type FuelType =
  | "petrol"
  | "diesel"
  | "hybrid"
  | "plug_in_hybrid"
  | "electric"
  | "other"
  | "unknown";

export type Transmission = "manual" | "automatic" | "unknown";

/** Which source supplied a field, with the raw value for auditability. */
export interface Provenance {
  field: string;
  source: Source;
  raw?: string | number | boolean | null;
  note?: string;
}

/** Free UK-only extras. All optional; absent when the provider did not return them. */
export interface UkVehicleDetails {
  taxStatus?: string;
  taxDueDate?: string;
  motStatus?: string;
  motExpiryDate?: string;
  /** Set for vehicles too new to have had an MOT. */
  motTestDueDate?: string;
  /** YYYY-MM (DVLA) or YYYY-MM-DD (DVSA). */
  firstRegistered?: string;
  euroStatus?: string;
  co2GPerKm?: number;
  typeApproval?: string;
  wheelplan?: string;
  hasOutstandingRecall?: string;
  markedForExport?: boolean;
  /** Number of MOT tests on record. The tests themselves live in sources.dvsaMot until Phase 2. */
  motTestCount?: number;
}

export interface RawSources {
  dvlaVes?: unknown;
  dvsaMot?: unknown;
  nhtsaVpic?: unknown;
  /** True when the payloads came from bundled demo fixtures, not live APIs. */
  fixture?: boolean;
  /** ISO timestamp of when the payloads were fetched. */
  fetchedAt?: string;
}

export interface VehicleCore {
  country: Country;
  /** Normalised: upper case, no spaces. */
  registration: string | null;
  vin: string | null;
  /** Display form, e.g. "Ford". */
  make: string;
  /** Exactly as the provider returned it, e.g. "FORD". Cache keys use this. */
  makeRaw: string;
  model: string | null;
  /** Year of manufacture where known; see provenance notes for fallbacks. */
  year: number | null;
  engineCc: number | null;
  fuel: FuelType;
  transmission: Transmission;
  colour: string | null;
  uk: UkVehicleDetails | null;
  provenance: Provenance[];
  sources: RawSources;
}

export interface Vehicle extends VehicleCore {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/** Fields the free APIs cannot supply reliably; the user confirms these before saving. */
export type ConfirmableField = "model" | "transmission" | "year";

/** What a lookup produces before the user confirms and saves it. */
export interface VehicleCandidate extends VehicleCore {
  warnings: string[];
  needsConfirmation: ConfirmableField[];
}
