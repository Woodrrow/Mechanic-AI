import type { FuelType, Transmission } from "./types";

/** Brand capitalisation that plain title-casing gets wrong. */
const MAKE_STYLE: Record<string, string> = {
  BMW: "BMW",
  MG: "MG",
  DS: "DS",
  SEAT: "SEAT",
  MINI: "MINI",
  KIA: "Kia",
  VW: "VW",
  BYD: "BYD",
  DAF: "DAF",
  MAN: "MAN",
  GMC: "GMC",
  MERCEDES: "Mercedes-Benz",
  "MERCEDES-BENZ": "Mercedes-Benz",
  "MERCEDES BENZ": "Mercedes-Benz",
  "LAND ROVER": "Land Rover",
  "ALFA ROMEO": "Alfa Romeo",
  "ASTON MARTIN": "Aston Martin",
  "ROLLS ROYCE": "Rolls-Royce",
  "ROLLS-ROYCE": "Rolls-Royce",
  MCLAREN: "McLaren",
  SSANGYONG: "SsangYong",
};

export function titleCase(raw: string): string {
  return raw
    .trim()
    .split(/\s+/)
    .map((word) =>
      /\d/.test(word)
        ? word.toUpperCase()
        : word
            .toLowerCase()
            .replace(/(^|[-/(])([a-z])/g, (_m, prefix: string, ch: string) => prefix + ch.toUpperCase()),
    )
    .join(" ");
}

export function displayMake(raw: string): string {
  const key = raw.trim().toUpperCase().replace(/\s+/g, " ");
  return MAKE_STYLE[key] ?? titleCase(raw);
}

/**
 * Maps the free-text fuel descriptions the providers use onto our enum.
 * DVLA: PETROL, DIESEL, HYBRID ELECTRIC, ELECTRICITY, ELECTRIC DIESEL, GAS BI-FUEL ...
 * DVSA: Petrol, Diesel, Electric, Hybrid Electric (Clean), Electric Diesel, LPG ...
 * vPIC: Gasoline, Diesel, Electric, plus an ElectrificationLevel field.
 */
export function normaliseFuel(raw: string | null | undefined, electrification?: string | null): FuelType {
  const e = (electrification ?? "").toUpperCase();
  if (e.includes("PHEV") || e.includes("PLUG")) return "plug_in_hybrid";
  if (e.includes("BEV")) return "electric";
  if (e.includes("HEV") || e.includes("MILD") || e.includes("STRONG")) return "hybrid";

  if (!raw) return "unknown";
  const s = raw.toUpperCase();
  if (s.includes("PLUG")) return "plug_in_hybrid";
  if (s.includes("HYBRID")) return "hybrid";
  if (s.includes("ELECTRIC") && (s.includes("DIESEL") || s.includes("PETROL"))) return "hybrid";
  if (s.includes("ELECTRIC")) return "electric";
  if (s.includes("DIESEL") || s.includes("HEAVY OIL")) return "diesel";
  if (s.includes("PETROL") || s.includes("GASOLINE")) return "petrol";
  return "other";
}

export function normaliseTransmission(raw: string | null | undefined): Transmission {
  if (!raw) return "unknown";
  const s = raw.toUpperCase();
  // "Automated Manual (AMT)" and dual-clutch boxes have no clutch pedal: automatic from the driver's seat.
  if (/AUTOMATIC|CVT|DUAL.?CLUTCH|DCT|AUTOMATED|DSG|TIPTRONIC/.test(s)) return "automatic";
  if (s.includes("MANUAL")) return "manual";
  return "unknown";
}

export function toInt(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  return Number.isFinite(n) ? n : null;
}

/** Pulls a four-digit year from "2015", "2015-03", "2015-03-17" or "17/03/2015". */
export function parseYear(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const match = String(value).match(/(19|20)\d{2}/);
  return match ? Number(match[0]) : null;
}

export function titleCaseOrNull(value: string | null | undefined): string | null {
  return value ? titleCase(value) : null;
}
