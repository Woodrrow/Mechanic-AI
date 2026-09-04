/**
 * Turns raw provider payloads into a VehicleCandidate with per-field
 * provenance. Rules of precedence are deliberate:
 *   make/year/engine/fuel/colour: DVLA first (the registration authority), DVSA second.
 *   model: DVSA only, because DVLA does not publish it.
 *   transmission: nobody publishes it; the user confirms.
 */
import type { VesVehicle } from "@/lib/providers/dvla-ves";
import { latestMotExpiry, type MotVehicle } from "@/lib/providers/dvsa-mot";
import type { VpicDecoded } from "@/lib/providers/nhtsa-vpic";
import {
  displayMake,
  normaliseFuel,
  normaliseTransmission,
  parseYear,
  titleCase,
  titleCaseOrNull,
  toInt,
} from "./normalise";
import type { ConfirmableField, Provenance, UkVehicleDetails, VehicleCandidate } from "./types";
import { vinRegion } from "./vin";

export const TRANSMISSION_WARNING =
  "Neither DVLA nor DVSA record the gearbox type. Please confirm whether it is manual or automatic.";

export interface UkMergeInput {
  registration: string | null;
  vin?: string | null;
  ves?: VesVehicle | null;
  mot?: MotVehicle | null;
  fixture?: boolean;
}

function compact<T extends object>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

export function candidateFromUk(input: UkMergeInput): VehicleCandidate | null {
  const ves = input.ves ?? null;
  const mot = input.mot ?? null;
  if (!ves && !mot) return null;

  const provenance: Provenance[] = [];
  const warnings: string[] = [];
  const needsConfirmation: ConfirmableField[] = [];

  const makeRaw = ves?.make?.trim() || mot?.make?.trim() || null;
  if (!makeRaw) return null;
  provenance.push({ field: "make", source: ves?.make?.trim() ? "dvla_ves" : "dvsa_mot", raw: makeRaw });

  let model: string | null = null;
  if (mot?.model?.trim()) {
    model = titleCase(mot.model);
    provenance.push({ field: "model", source: "dvsa_mot", raw: mot.model });
  } else {
    needsConfirmation.push("model");
    warnings.push(
      mot
        ? "The DVSA record for this vehicle has no model name. Please enter it."
        : "DVLA does not publish model names and no DVSA MOT record was available, so the model is unknown. Please enter it.",
    );
  }

  let year: number | null = null;
  const motManufactureYear = parseYear(mot?.manufactureDate) ?? parseYear(mot?.manufactureYear);
  if (ves?.yearOfManufacture) {
    year = ves.yearOfManufacture;
    provenance.push({ field: "year", source: "dvla_ves", raw: ves.yearOfManufacture });
  } else if (motManufactureYear) {
    year = motManufactureYear;
    provenance.push({ field: "year", source: "dvsa_mot", raw: mot?.manufactureDate ?? mot?.manufactureYear ?? null });
  } else {
    const fromMot = parseYear(mot?.registrationDate);
    const fromVes = parseYear(ves?.monthOfFirstRegistration);
    const regYear = fromMot ?? fromVes;
    if (regYear) {
      year = regYear;
      provenance.push({
        field: "year",
        source: fromMot ? "dvsa_mot" : "dvla_ves",
        raw: fromMot ? (mot?.registrationDate ?? null) : (ves?.monthOfFirstRegistration ?? null),
        note: "Year of first registration; the year of manufacture was not available.",
      });
      needsConfirmation.push("year");
      warnings.push(
        "Only the first-registration year was available. Cars are sometimes registered the year after they were built, so please check.",
      );
    } else {
      needsConfirmation.push("year");
      warnings.push("No year was available from either source. Please enter it.");
    }
  }

  let engineCc: number | null = null;
  if (ves?.engineCapacity) {
    engineCc = ves.engineCapacity;
    provenance.push({ field: "engineCc", source: "dvla_ves", raw: ves.engineCapacity });
  } else if (toInt(mot?.engineSize)) {
    engineCc = toInt(mot?.engineSize);
    provenance.push({ field: "engineCc", source: "dvsa_mot", raw: mot?.engineSize ?? null });
  }

  const fuelRaw = ves?.fuelType ?? mot?.fuelType ?? null;
  const fuel = normaliseFuel(fuelRaw);
  if (fuelRaw) provenance.push({ field: "fuel", source: ves?.fuelType ? "dvla_ves" : "dvsa_mot", raw: fuelRaw });
  if (fuel === "unknown") warnings.push("The fuel type was not available. Please check it on the vehicle page.");
  if (fuel === "other") warnings.push(`Fuel type "${fuelRaw}" is unusual; guides will treat it as "other".`);

  const colourRaw = ves?.colour ?? mot?.primaryColour ?? null;
  const colour = titleCaseOrNull(colourRaw);
  if (colourRaw) provenance.push({ field: "colour", source: ves?.colour ? "dvla_ves" : "dvsa_mot", raw: colourRaw });

  needsConfirmation.push("transmission");
  warnings.push(TRANSMISSION_WARNING);

  const uk: UkVehicleDetails = compact({
    taxStatus: ves?.taxStatus,
    taxDueDate: ves?.taxDueDate,
    motStatus: ves?.motStatus,
    motExpiryDate: ves?.motExpiryDate ?? (mot ? latestMotExpiry(mot) : undefined),
    motTestDueDate: mot?.motTestDueDate,
    firstRegistered: ves?.monthOfFirstRegistration ?? mot?.registrationDate,
    euroStatus: ves?.euroStatus,
    co2GPerKm: ves?.co2Emissions,
    typeApproval: ves?.typeApproval,
    wheelplan: ves?.wheelplan,
    hasOutstandingRecall: mot?.hasOutstandingRecall,
    markedForExport: ves?.markedForExport,
    motTestCount: mot ? (mot.motTests?.length ?? 0) : undefined,
  });

  const registrationRaw = ves?.registrationNumber ?? mot?.registration ?? input.registration ?? "";
  const registration = registrationRaw.toUpperCase().replace(/[^A-Z0-9]/g, "") || null;

  return {
    country: "GB",
    registration,
    vin: input.vin ?? null,
    make: displayMake(makeRaw),
    makeRaw,
    model,
    year,
    engineCc,
    fuel,
    transmission: "unknown",
    colour,
    uk,
    provenance,
    sources: compact({ dvlaVes: ves ?? undefined, dvsaMot: mot ?? undefined, fixture: input.fixture || undefined }),
    warnings,
    needsConfirmation,
  };
}

export function candidateFromVpic(decoded: VpicDecoded, opts: { fixture?: boolean } = {}): VehicleCandidate | null {
  if (!decoded.make) return null;

  const provenance: Provenance[] = [];
  const warnings: string[] = [];
  const needsConfirmation: ConfirmableField[] = [];
  const region = vinRegion(decoded.vin);

  provenance.push({ field: "make", source: "nhtsa_vpic", raw: decoded.make });

  let model: string | null = null;
  if (decoded.model) {
    model = titleCase(decoded.model);
    provenance.push({ field: "model", source: "nhtsa_vpic", raw: decoded.model });
  } else {
    needsConfirmation.push("model");
    warnings.push(
      region === "europe"
        ? "vPIC is built from US manufacturer filings. This VIN is European, so only the manufacturer could be decoded. Please enter the model."
        : "vPIC could not decode the model from this VIN. Please enter it.",
    );
  }

  let year: number | null = null;
  if (decoded.modelYear) {
    year = decoded.modelYear;
    provenance.push({
      field: "year",
      source: "nhtsa_vpic",
      raw: decoded.modelYear,
      note: "Model year (US convention), which can run one year ahead of the build date.",
    });
  } else {
    needsConfirmation.push("year");
    warnings.push("No model year could be decoded. Please enter the year.");
  }

  let engineCc: number | null = null;
  if (decoded.displacementCc) {
    engineCc = Math.round(decoded.displacementCc);
    provenance.push({ field: "engineCc", source: "nhtsa_vpic", raw: decoded.displacementCc });
  } else if (decoded.displacementL) {
    engineCc = Math.round(decoded.displacementL * 1000);
    provenance.push({ field: "engineCc", source: "nhtsa_vpic", raw: decoded.displacementL, note: "Converted from litres." });
  }

  const fuel = normaliseFuel(decoded.fuelPrimary, decoded.electrification);
  if (decoded.fuelPrimary || decoded.electrification) {
    provenance.push({ field: "fuel", source: "nhtsa_vpic", raw: decoded.fuelPrimary ?? decoded.electrification });
  }

  const transmission = normaliseTransmission(decoded.transmissionStyle);
  if (transmission !== "unknown") {
    provenance.push({ field: "transmission", source: "nhtsa_vpic", raw: decoded.transmissionStyle });
  } else {
    needsConfirmation.push("transmission");
    warnings.push("The gearbox type was not in the VIN data. Please confirm whether it is manual or automatic.");
  }

  if (decoded.errorCodes.some((c) => c !== 0) && decoded.errorText) {
    warnings.push(`vPIC note: ${decoded.errorText}`);
  }

  return {
    country: region === "north_america" ? "US" : "other",
    registration: null,
    vin: decoded.vin,
    make: displayMake(decoded.make),
    makeRaw: decoded.make,
    model,
    year,
    engineCc,
    fuel,
    transmission,
    colour: null,
    uk: null,
    provenance,
    sources: compact({ nhtsaVpic: decoded.raw, fixture: opts.fixture || undefined }),
    warnings,
    needsConfirmation,
  };
}

/** Fills gaps in a UK candidate from a vPIC decode of the same VIN. */
export function supplementWithVpic(candidate: VehicleCandidate, decoded: VpicDecoded): VehicleCandidate {
  const next: VehicleCandidate = {
    ...candidate,
    provenance: [...candidate.provenance],
    warnings: [...candidate.warnings],
    needsConfirmation: [...candidate.needsConfirmation],
    sources: { ...candidate.sources, nhtsaVpic: decoded.raw },
  };

  const transmission = normaliseTransmission(decoded.transmissionStyle);
  if (next.transmission === "unknown" && transmission !== "unknown") {
    next.transmission = transmission;
    next.provenance.push({ field: "transmission", source: "nhtsa_vpic", raw: decoded.transmissionStyle });
    next.needsConfirmation = next.needsConfirmation.filter((f) => f !== "transmission");
    next.warnings = next.warnings.filter((w) => w !== TRANSMISSION_WARNING);
  }

  if (!next.engineCc && decoded.displacementCc) {
    next.engineCc = Math.round(decoded.displacementCc);
    next.provenance.push({ field: "engineCc", source: "nhtsa_vpic", raw: decoded.displacementCc });
  }

  return next;
}
