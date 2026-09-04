/**
 * DVLA Vehicle Enquiry Service (VES) v1.
 * POST {base}/vehicle-enquiry/v1/vehicles  { "registrationNumber": "AB12CDE" }
 * Header: x-api-key. Free; one key per organisation; rate limit set at registration.
 *
 * What it does NOT return: the model name, engine code, or transmission.
 * Errors: 400 invalid registration format, 403 bad key, 404 not found,
 * 429 quota exceeded, 500/503 upstream.
 */
import { z } from "zod";
import type { Result } from "@/lib/result";
import { ProviderError, requestJson } from "./errors";

export const DVLA_VES_DEFAULT_BASE_URL = "https://driver-vehicle-licensing.api.gov.uk";
export const DVLA_VES_UAT_BASE_URL = "https://uat.driver-vehicle-licensing.api.gov.uk";

export const VesVehicleSchema = z
  .object({
    registrationNumber: z.string(),
    make: z.string().optional(),
    yearOfManufacture: z.number().int().optional(),
    engineCapacity: z.number().int().optional(),
    fuelType: z.string().optional(),
    colour: z.string().optional(),
    taxStatus: z.string().optional(),
    taxDueDate: z.string().optional(),
    motStatus: z.string().optional(),
    motExpiryDate: z.string().optional(),
    monthOfFirstRegistration: z.string().optional(),
    co2Emissions: z.number().optional(),
    euroStatus: z.string().optional(),
    typeApproval: z.string().optional(),
    wheelplan: z.string().optional(),
    markedForExport: z.boolean().optional(),
    dateOfLastV5CIssued: z.string().optional(),
    revenueWeight: z.number().optional(),
    realDrivingEmissions: z.string().optional(),
    artEndDate: z.string().optional(),
    automatedVehicle: z.boolean().optional(),
  })
  .loose();

export type VesVehicle = z.infer<typeof VesVehicleSchema>;

export interface VesClientOptions {
  apiKey: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export async function fetchVesVehicle(
  registration: string,
  opts: VesClientOptions,
): Promise<Result<VesVehicle, ProviderError>> {
  const base = (opts.baseUrl ?? DVLA_VES_DEFAULT_BASE_URL).replace(/\/$/, "");
  return requestJson({
    provider: "dvla_ves",
    url: `${base}/vehicle-enquiry/v1/vehicles`,
    init: {
      method: "POST",
      headers: {
        "x-api-key": opts.apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({ registrationNumber: registration }),
      cache: "no-store",
    },
    schema: VesVehicleSchema,
    fetchImpl: opts.fetchImpl,
    timeoutMs: opts.timeoutMs,
  });
}
