/**
 * DVSA MOT History API v1 (the 2023+ service; the old beta.check-mot host is retired).
 * GET {base}/v1/trade/vehicles/registration/{reg}
 * GET {base}/v1/trade/vehicles/vin/{vin}
 * Auth: OAuth2 client-credentials bearer token (60 min) + X-API-Key header.
 * Quotas are per key and set by DVSA at registration; exceeding the daily quota
 * locks the key for 24 hours, so the token is cached and lookups are never retried blindly.
 *
 * Two response shapes: vehicles with tests (firstUsedDate, engineSize, motTests[])
 * and vehicles too new for an MOT (manufactureYear, motTestDueDate, no motTests).
 * Both carry make and model, which DVLA VES does not.
 */
import { z } from "zod";
import { err, ok, type Result } from "@/lib/result";
import { ProviderError, requestJson } from "./errors";

export const DVSA_MOT_DEFAULT_BASE_URL = "https://history.mot.api.gov.uk";
export const DVSA_MOT_DEFAULT_TOKEN_URL =
  "https://login.microsoftonline.com/a455b827-244f-4c97-b5b4-ce5d13b4d00c/oauth2/v2.0/token";
export const DVSA_MOT_DEFAULT_SCOPE = "https://tapi.dvsa.gov.uk/.default";

export const MotDefectSchema = z
  .object({
    text: z.string(),
    /** ADVISORY | MINOR | MAJOR | DANGEROUS | FAIL | PRS | USER ENTERED | NON SPECIFIC | SYSTEM GENERATED */
    type: z.string(),
    dangerous: z.boolean().optional(),
  })
  .loose();

export const MotTestSchema = z
  .object({
    completedDate: z.string(),
    /** PASSED | FAILED */
    testResult: z.string(),
    expiryDate: z.string().optional(),
    odometerValue: z.union([z.string(), z.number()]).optional(),
    odometerUnit: z.string().optional(),
    /** READ | UNREADABLE | NO_ODOMETER */
    odometerResultType: z.string().optional(),
    motTestNumber: z.string().optional(),
    /** DVSA | DVA NI | CVS */
    dataSource: z.string().optional(),
    defects: z.array(MotDefectSchema).optional(),
  })
  .loose();

export const MotVehicleSchema = z
  .object({
    registration: z.string().optional(),
    make: z.string().optional(),
    model: z.string().optional(),
    firstUsedDate: z.string().optional(),
    fuelType: z.string().optional(),
    primaryColour: z.string().optional(),
    registrationDate: z.string().optional(),
    manufactureDate: z.string().optional(),
    manufactureYear: z.union([z.string(), z.number()]).optional(),
    engineSize: z.union([z.string(), z.number()]).optional(),
    hasOutstandingRecall: z.string().optional(),
    motTestDueDate: z.string().optional(),
    motTests: z.array(MotTestSchema).optional(),
  })
  .loose();

export type MotVehicle = z.infer<typeof MotVehicleSchema>;
export type MotTest = z.infer<typeof MotTestSchema>;
export type MotDefect = z.infer<typeof MotDefectSchema>;

export interface MotCredentials {
  clientId: string;
  clientSecret: string;
  apiKey: string;
  tokenUrl?: string;
  scope?: string;
  baseUrl?: string;
}

export interface MotClientOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

const TokenResponseSchema = z
  .object({
    access_token: z.string(),
    expires_in: z.union([z.number(), z.string()]).optional(),
    token_type: z.string().optional(),
  })
  .loose();

interface CachedToken {
  key: string;
  token: string;
  expiresAt: number;
}

let cachedToken: CachedToken | null = null;

/** Test hook. */
export function resetMotTokenCache(): void {
  cachedToken = null;
}

export async function getMotAccessToken(
  creds: MotCredentials,
  opts: MotClientOptions = {},
  now: () => number = Date.now,
): Promise<Result<string, ProviderError>> {
  const cacheKey = `${creds.clientId}:${creds.tokenUrl ?? ""}:${creds.scope ?? ""}`;
  if (cachedToken && cachedToken.key === cacheKey && cachedToken.expiresAt > now()) {
    return ok(cachedToken.token);
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
    scope: creds.scope ?? DVSA_MOT_DEFAULT_SCOPE,
  });

  const result = await requestJson({
    provider: "dvsa_mot",
    url: creds.tokenUrl ?? DVSA_MOT_DEFAULT_TOKEN_URL,
    init: {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
      body: body.toString(),
      cache: "no-store",
    },
    schema: TokenResponseSchema,
    fetchImpl: opts.fetchImpl,
    timeoutMs: opts.timeoutMs,
  });
  if (!result.ok) {
    // A token failure is a credentials problem, whatever status Azure AD used.
    return err(
      new ProviderError("dvsa_mot", "unauthorised", `MOT history token request failed: ${result.error.message}`, {
        status: result.error.status,
      }),
    );
  }

  const expiresIn = Number(result.value.expires_in ?? 3600);
  const safetyMarginMs = 60_000;
  cachedToken = {
    key: cacheKey,
    token: result.value.access_token,
    expiresAt: now() + Math.max(0, expiresIn * 1000 - safetyMarginMs),
  };
  return ok(cachedToken.token);
}

async function fetchMotVehicle(
  path: string,
  creds: MotCredentials,
  opts: MotClientOptions,
): Promise<Result<MotVehicle, ProviderError>> {
  const token = await getMotAccessToken(creds, opts);
  if (!token.ok) return token;
  const base = (creds.baseUrl ?? DVSA_MOT_DEFAULT_BASE_URL).replace(/\/$/, "");
  return requestJson({
    provider: "dvsa_mot",
    url: `${base}${path}`,
    init: {
      method: "GET",
      headers: {
        authorization: `Bearer ${token.value}`,
        "x-api-key": creds.apiKey,
        accept: "application/json",
      },
      cache: "no-store",
    },
    schema: MotVehicleSchema,
    fetchImpl: opts.fetchImpl,
    timeoutMs: opts.timeoutMs,
  });
}

export function fetchMotVehicleByRegistration(
  registration: string,
  creds: MotCredentials,
  opts: MotClientOptions = {},
): Promise<Result<MotVehicle, ProviderError>> {
  return fetchMotVehicle(`/v1/trade/vehicles/registration/${encodeURIComponent(registration)}`, creds, opts);
}

export function fetchMotVehicleByVin(
  vin: string,
  creds: MotCredentials,
  opts: MotClientOptions = {},
): Promise<Result<MotVehicle, ProviderError>> {
  return fetchMotVehicle(`/v1/trade/vehicles/vin/${encodeURIComponent(vin)}`, creds, opts);
}

/** The expiry date of the most recent pass, if any. */
export function latestMotExpiry(vehicle: MotVehicle): string | undefined {
  const passes = (vehicle.motTests ?? []).filter((t) => t.testResult.toUpperCase() === "PASSED" && t.expiryDate);
  passes.sort((a, b) => (b.expiryDate ?? "").localeCompare(a.expiryDate ?? ""));
  return passes[0]?.expiryDate;
}
