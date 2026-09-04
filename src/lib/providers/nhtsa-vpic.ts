/**
 * NHTSA vPIC VIN decoder. No key. Built from US manufacturer (49 CFR 565)
 * filings, so US-market VINs decode fully and EU-market VINs often return
 * only the manufacturer plus an ErrorCode explaining the gap.
 *
 * GET {base}/vehicles/DecodeVinValues/{vin}?format=json  -> { Results: [ { flat fields } ] }
 * ErrorCode is a comma-separated list: 0 clean; 1 check digit wrong;
 * 6 incomplete; 7 manufacturer not registered for US sale; 8 no detailed data;
 * 14 some characters could not be decoded.
 */
import { z } from "zod";
import { err, ok, type Result } from "@/lib/result";
import { ProviderError, requestJson } from "./errors";

export const NHTSA_VPIC_DEFAULT_BASE_URL = "https://vpic.nhtsa.dot.gov/api";

export type VpicRow = Record<string, string | null>;

export const VpicResponseSchema = z
  .object({
    Count: z.number().optional(),
    Message: z.string().optional(),
    Results: z.array(z.record(z.string(), z.string().nullable())),
  })
  .loose();

export interface VpicDecoded {
  vin: string;
  make: string | null;
  model: string | null;
  modelYear: number | null;
  manufacturer: string | null;
  vehicleType: string | null;
  bodyClass: string | null;
  displacementCc: number | null;
  displacementL: number | null;
  engineModel: string | null;
  engineCylinders: number | null;
  fuelPrimary: string | null;
  fuelSecondary: string | null;
  electrification: string | null;
  transmissionStyle: string | null;
  plantCountry: string | null;
  errorCodes: number[];
  errorText: string | null;
  raw: VpicRow;
}

function text(row: VpicRow, key: string): string | null {
  const v = row[key];
  return v && v.trim() !== "" ? v.trim() : null;
}

function num(row: VpicRow, key: string): number | null {
  const v = text(row, key);
  if (v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function parseVpicErrorCodes(raw: string | null | undefined): number[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n));
}

export function decodeVpicRow(row: VpicRow, vin: string): VpicDecoded {
  return {
    vin,
    make: text(row, "Make"),
    model: text(row, "Model"),
    modelYear: num(row, "ModelYear"),
    manufacturer: text(row, "Manufacturer"),
    vehicleType: text(row, "VehicleType"),
    bodyClass: text(row, "BodyClass"),
    displacementCc: num(row, "DisplacementCC"),
    displacementL: num(row, "DisplacementL"),
    engineModel: text(row, "EngineModel"),
    engineCylinders: num(row, "EngineCylinders"),
    fuelPrimary: text(row, "FuelTypePrimary"),
    fuelSecondary: text(row, "FuelTypeSecondary"),
    electrification: text(row, "ElectrificationLevel"),
    transmissionStyle: text(row, "TransmissionStyle"),
    plantCountry: text(row, "PlantCountry"),
    errorCodes: parseVpicErrorCodes(row.ErrorCode),
    errorText: text(row, "ErrorText"),
    raw: row,
  };
}

export interface VpicClientOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export async function fetchVpicDecode(
  vin: string,
  opts: VpicClientOptions = {},
): Promise<Result<VpicDecoded, ProviderError>> {
  const base = (opts.baseUrl ?? NHTSA_VPIC_DEFAULT_BASE_URL).replace(/\/$/, "");
  const result = await requestJson({
    provider: "nhtsa_vpic",
    url: `${base}/vehicles/DecodeVinValues/${encodeURIComponent(vin)}?format=json`,
    init: { method: "GET", headers: { accept: "application/json" }, cache: "no-store" },
    schema: VpicResponseSchema,
    fetchImpl: opts.fetchImpl,
    timeoutMs: opts.timeoutMs,
  });
  if (!result.ok) return result;
  const row = result.value.Results[0];
  if (!row) return err(new ProviderError("nhtsa_vpic", "invalid_response", "vPIC returned no results."));
  const decoded = decodeVpicRow(row, vin);
  if (!decoded.make) {
    return err(
      new ProviderError(
        "nhtsa_vpic",
        "not_found",
        decoded.errorText ?? "vPIC could not identify the manufacturer from this VIN.",
      ),
    );
  }
  return ok(decoded);
}
