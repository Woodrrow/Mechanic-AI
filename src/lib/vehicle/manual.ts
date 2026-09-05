/**
 * Manual entry: the user types what the V5C logbook says. Used while the
 * government APIs are unavailable and as a permanent fallback for cars the
 * records cannot find. Produces the same VehicleCore as a lookup, with every
 * field's provenance marked "user".
 */
import { displayMake, titleCase } from "./normalise";
import { isPlausibleRegistration, normaliseRegistration } from "./registration";
import type { FuelType, Provenance, Transmission, VehicleCore } from "./types";
import { isPlausibleVin, normaliseVin, vinRegion } from "./vin";

export interface ManualEntryInput {
  make: string;
  model: string;
  year: string;
  fuel: FuelType | "";
  /** cc ("1596") or litres ("1.6"); blank allowed. */
  engine: string;
  transmission: Transmission;
  colour: string;
  registration: string;
  vin: string;
  ukRegistered: boolean;
}

export type ManualEntryErrors = Partial<Record<keyof ManualEntryInput, string>>;

export type ManualEntryResult = { ok: true; vehicle: VehicleCore } | { ok: false; errors: ManualEntryErrors };

export const EMPTY_MANUAL_ENTRY: ManualEntryInput = {
  make: "",
  model: "",
  year: "",
  fuel: "",
  engine: "",
  transmission: "unknown",
  colour: "",
  registration: "",
  vin: "",
  ukRegistered: true,
};

export const MIN_YEAR = 1950;

/**
 * "1596" -> 1596cc; "1.6" / "1,6" / "1.6L" -> 1600cc (flagged); "" -> no engine size.
 * Returns null when the text is not a usable number.
 */
export function parseEngineSize(raw: string): { cc: number | null; fromLitres: boolean } | null {
  const text = raw
    .trim()
    .replace(",", ".")
    .replace(/\s*(cc|l|litres?|liters?)\s*$/i, "")
    .trim();
  if (!text) return { cc: null, fromLitres: false };
  const n = Number(text);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n < 20) return { cc: Math.round(n * 1000), fromLitres: true };
  if (n >= 50 && n <= 10_000) return { cc: Math.round(n), fromLitres: false };
  return null;
}

export function vehicleFromManualEntry(input: ManualEntryInput, now: Date = new Date()): ManualEntryResult {
  const errors: ManualEntryErrors = {};

  const make = input.make.trim();
  if (!make) errors.make = "Enter the make, e.g. Ford.";

  const model = input.model.trim();
  if (!model) errors.model = "Enter the model, e.g. Focus.";

  const maxYear = now.getFullYear() + 1;
  const yearText = input.year.trim();
  const year = Number.parseInt(yearText, 10);
  if (!/^\d{4}$/.test(yearText) || year < MIN_YEAR || year > maxYear) {
    errors.year = `Enter a four-digit year between ${MIN_YEAR} and ${maxYear}.`;
  }

  if (!input.fuel) errors.fuel = "Choose the fuel type.";

  const engine = parseEngineSize(input.engine);
  if (engine === null) errors.engine = "Enter the engine size in cc (e.g. 1596) or litres (e.g. 1.6), or leave it blank.";

  let registration: string | null = null;
  if (input.registration.trim()) {
    const normalised = normaliseRegistration(input.registration);
    if (!isPlausibleRegistration(normalised)) {
      errors.registration = "That does not look like a UK registration. Leave it blank if you are not sure.";
    } else {
      registration = normalised;
    }
  }

  let vin: string | null = null;
  if (input.vin.trim()) {
    const normalised = normaliseVin(input.vin);
    if (!isPlausibleVin(normalised)) {
      errors.vin = "A VIN is 17 characters and never contains I, O or Q.";
    } else {
      vin = normalised;
    }
  }

  if (Object.keys(errors).length > 0 || engine === null || !input.fuel) {
    return { ok: false, errors };
  }

  const colour = input.colour.trim();
  const provenance: Provenance[] = [
    { field: "make", source: "user", raw: make },
    { field: "model", source: "user", raw: model },
    { field: "year", source: "user", raw: year },
    { field: "fuel", source: "user", raw: input.fuel },
  ];
  if (engine.cc) {
    provenance.push(
      engine.fromLitres
        ? {
            field: "engineCc",
            source: "user",
            raw: input.engine.trim(),
            note: "Converted from litres. The exact figure is on the V5C, field P.1.",
          }
        : { field: "engineCc", source: "user", raw: engine.cc },
    );
  }
  if (input.transmission !== "unknown") provenance.push({ field: "transmission", source: "user", raw: input.transmission });
  if (colour) provenance.push({ field: "colour", source: "user", raw: colour });

  const country = input.ukRegistered ? "GB" : vin && vinRegion(vin) === "north_america" ? "US" : "other";

  return {
    ok: true,
    vehicle: {
      country,
      registration,
      vin,
      make: displayMake(make),
      makeRaw: make.toUpperCase(),
      model: titleCase(model),
      year,
      engineCc: engine.cc,
      fuel: input.fuel,
      transmission: input.transmission,
      colour: colour ? titleCase(colour) : null,
      uk: null,
      provenance,
      sources: {},
    },
  };
}
