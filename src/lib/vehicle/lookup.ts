/**
 * Lookup orchestration. Server-only: this is where API keys are used.
 *
 * Registration path: DVLA VES and DVSA MOT are queried in parallel and merged.
 * Either alone is enough for a candidate; DVSA is the only source of the model.
 * VIN path: DVSA MOT by VIN (UK-registered cars) plus NHTSA vPIC, merged the same way.
 *
 * Fixtures (POCKET_MECHANIC_USE_FIXTURES=1) serve bundled sample vehicles
 * through the same code so the UI can be exercised without keys. They are
 * never a silent fallback: with no provider configured, registration lookup
 * is reported as unavailable and the UI offers manual entry instead.
 */
import { fetchVesVehicle, type VesVehicle } from "@/lib/providers/dvla-ves";
import {
  fetchMotVehicleByRegistration,
  fetchMotVehicleByVin,
  type MotCredentials,
  type MotVehicle,
} from "@/lib/providers/dvsa-mot";
import { PROVIDER_LABEL, ProviderError, type ProviderErrorKind, type ProviderName } from "@/lib/providers/errors";
import { REGISTRATION_FIXTURES, VIN_FIXTURES } from "@/lib/providers/fixtures";
import { decodeVpicRow, fetchVpicDecode, type VpicDecoded } from "@/lib/providers/nhtsa-vpic";
import { err, ok, type Result } from "@/lib/result";
import { candidateFromUk, candidateFromVpic, supplementWithVpic } from "./merge";
import { isPlausibleRegistration, normaliseRegistration } from "./registration";
import type { VehicleCandidate } from "./types";
import { isPlausibleVin, normaliseVin, vinCheckDigitValid, vinRegion } from "./vin";

export type ProviderStatus = "live" | "fixture" | "skipped" | "failed";

export interface ProviderReport {
  status: ProviderStatus;
  detail?: string;
}

export type ProviderReports = Partial<Record<ProviderName, ProviderReport>>;

export interface LookupOutcome {
  candidate: VehicleCandidate;
  providers: ProviderReports;
  demo: boolean;
}

export type LookupErrorCode =
  | "invalid_registration"
  | "invalid_vin"
  | "vehicle_not_found"
  | "provider_unavailable"
  | "provider_misconfigured"
  | "rate_limited";

export interface LookupError {
  code: LookupErrorCode;
  message: string;
  status: number;
  retryAfterSeconds?: number;
}

export interface LookupDeps {
  vesApiKey?: string;
  vesBaseUrl?: string;
  mot?: MotCredentials;
  vpicBaseUrl?: string;
  useFixtures?: boolean;
  fetchImpl?: typeof fetch;
}

export function lookupDepsFromEnv(env: Record<string, string | undefined> = process.env): LookupDeps {
  const mot: MotCredentials | undefined =
    env.DVSA_MOT_CLIENT_ID && env.DVSA_MOT_CLIENT_SECRET && env.DVSA_MOT_API_KEY
      ? {
          clientId: env.DVSA_MOT_CLIENT_ID,
          clientSecret: env.DVSA_MOT_CLIENT_SECRET,
          apiKey: env.DVSA_MOT_API_KEY,
          tokenUrl: env.DVSA_MOT_TOKEN_URL || undefined,
          scope: env.DVSA_MOT_SCOPE || undefined,
          baseUrl: env.DVSA_MOT_BASE_URL || undefined,
        }
      : undefined;
  return {
    vesApiKey: env.DVLA_VES_API_KEY || undefined,
    vesBaseUrl: env.DVLA_VES_BASE_URL || undefined,
    mot,
    vpicBaseUrl: env.NHTSA_VPIC_BASE_URL || undefined,
    useFixtures: /^(1|true|yes|on)$/i.test(env.POCKET_MECHANIC_USE_FIXTURES ?? ""),
  };
}

/** Fixtures are served only when explicitly requested. */
export function usesFixtures(deps: LookupDeps): boolean {
  return Boolean(deps.useFixtures);
}

/** What the add-vehicle screen can offer, given the configured providers. */
export interface LookupAvailability {
  /** Needs DVLA or DVSA credentials (or fixtures). */
  registration: boolean;
  /** vPIC is keyless, so VIN lookup is always on. */
  vin: boolean;
  fixtures: boolean;
  dvlaVes: boolean;
  dvsaMot: boolean;
}

export function lookupAvailability(deps: LookupDeps): LookupAvailability {
  const fixtures = usesFixtures(deps);
  return {
    registration: fixtures || Boolean(deps.vesApiKey || deps.mot),
    vin: true,
    fixtures,
    dvlaVes: Boolean(deps.vesApiKey),
    dvsaMot: Boolean(deps.mot),
  };
}

type Attempt<T> =
  | { status: "live" | "fixture"; result: Result<T, ProviderError> }
  | { status: "skipped"; reason: string };

const STATUS_FOR_KIND: Partial<Record<ProviderErrorKind, number>> = {
  not_found: 404,
  bad_request: 400,
  unauthorised: 403,
  rate_limited: 429,
  unavailable: 503,
};

const FIXTURE_MESSAGE: Partial<Record<ProviderErrorKind, string>> = {
  not_found: "Record for vehicle not found",
  bad_request: "Invalid format for field - vehicle registration number",
  rate_limited: "Too Many Requests",
  unauthorised: "Forbidden",
  unavailable: "Service Unavailable",
};

function fixtureAttempt<T>(provider: ProviderName, value: T | undefined, errorKind?: ProviderErrorKind): Attempt<T> {
  if (value !== undefined) return { status: "fixture", result: ok(value) };
  const kind = errorKind ?? "not_found";
  return {
    status: "fixture",
    result: err(
      new ProviderError(provider, kind, FIXTURE_MESSAGE[kind] ?? kind, {
        status: STATUS_FOR_KIND[kind],
        retryAfterSeconds: kind === "rate_limited" ? 30 : undefined,
      }),
    ),
  };
}

async function liveAttempt<T>(call: () => Promise<Result<T, ProviderError>>): Promise<Attempt<T>> {
  return { status: "live", result: await call() };
}

function skipped<T>(reason: string): Attempt<T> {
  return { status: "skipped", reason };
}

function valueOf<T>(attempt: Attempt<T>): T | null {
  return attempt.status !== "skipped" && attempt.result.ok ? attempt.result.value : null;
}

function report<T>(attempt: Attempt<T>): ProviderReport {
  if (attempt.status === "skipped") return { status: "skipped", detail: attempt.reason };
  if (attempt.result.ok) return { status: attempt.status };
  return { status: "failed", detail: `${attempt.result.error.kind}: ${attempt.result.error.message}` };
}

function addProviderWarnings(candidate: VehicleCandidate, attempts: Array<[ProviderName, Attempt<unknown>]>): void {
  for (const [name, attempt] of attempts) {
    // An unconfigured provider is a deployment fact, not something the user can act on.
    if (attempt.status === "skipped") continue;
    if (!attempt.result.ok) {
      const e = attempt.result.error;
      if (name === "dvsa_mot" && e.kind === "not_found") {
        candidate.warnings.push("No DVSA MOT record was found for this vehicle.");
      } else {
        candidate.warnings.push(`${PROVIDER_LABEL[name]}: ${e.message}`);
      }
    }
  }
}

function combineFailures(attempts: Array<Attempt<unknown>>, subject: "registration" | "vin"): LookupError {
  const errors = attempts.flatMap((a) => (a.status !== "skipped" && !a.result.ok ? [a.result.error] : []));
  if (errors.length === 0) {
    return {
      code: "provider_misconfigured",
      status: 503,
      message: "No vehicle data provider is configured on the server.",
    };
  }
  const kinds = new Set(errors.map((e) => e.kind));
  const onlyClientSide = [...kinds].every((k) => k === "not_found" || k === "bad_request");
  if (onlyClientSide) {
    if (kinds.has("not_found")) {
      return {
        code: "vehicle_not_found",
        status: 404,
        message:
          subject === "registration"
            ? "No vehicle was found for that registration. Check it and try again."
            : "No vehicle was found for that VIN. Check it and try again.",
      };
    }
    return {
      code: subject === "registration" ? "invalid_registration" : "invalid_vin",
      status: 400,
      message: errors[0].message,
    };
  }
  if (kinds.has("rate_limited")) {
    const retry = Math.max(...errors.map((e) => e.retryAfterSeconds ?? 0), 0) || 60;
    return {
      code: "rate_limited",
      status: 503,
      message: "The vehicle data service is busy right now. Try again in a minute.",
      retryAfterSeconds: retry,
    };
  }
  if (kinds.has("unauthorised")) {
    return {
      code: "provider_misconfigured",
      status: 502,
      message: "A vehicle data provider refused our request. This is a configuration problem on our side, not yours.",
    };
  }
  return {
    code: "provider_unavailable",
    status: 503,
    message: "The vehicle data service is unavailable right now. Try again shortly.",
  };
}

export async function lookupByRegistration(
  input: string,
  deps: LookupDeps,
): Promise<Result<LookupOutcome, LookupError>> {
  const registration = normaliseRegistration(input);
  if (!isPlausibleRegistration(registration)) {
    return err({
      code: "invalid_registration",
      status: 400,
      message:
        "That does not look like a UK registration. Check for mixed-up letters and numbers (O and 0, I and 1) and try again.",
    });
  }

  const demo = usesFixtures(deps);
  if (!demo && !deps.vesApiKey && !deps.mot) {
    return err({
      code: "provider_misconfigured",
      status: 503,
      message: "Registration lookup is not available on this server yet. Type the details in instead.",
    });
  }
  let vesAttempt: Attempt<VesVehicle>;
  let motAttempt: Attempt<MotVehicle>;

  if (demo) {
    const fixture = REGISTRATION_FIXTURES[registration];
    vesAttempt = fixtureAttempt("dvla_ves", fixture?.ves, fixture?.vesError);
    motAttempt = fixtureAttempt("dvsa_mot", fixture?.mot, fixture?.motError);
  } else {
    [vesAttempt, motAttempt] = await Promise.all([
      deps.vesApiKey
        ? liveAttempt(() =>
            fetchVesVehicle(registration, {
              apiKey: deps.vesApiKey as string,
              baseUrl: deps.vesBaseUrl,
              fetchImpl: deps.fetchImpl,
            }),
          )
        : Promise.resolve(skipped<VesVehicle>("DVLA_VES_API_KEY is not set")),
      deps.mot
        ? liveAttempt(() => fetchMotVehicleByRegistration(registration, deps.mot as MotCredentials, { fetchImpl: deps.fetchImpl }))
        : Promise.resolve(skipped<MotVehicle>("DVSA MOT credentials are not set")),
    ]);
  }

  const candidate = candidateFromUk({
    registration,
    ves: valueOf(vesAttempt),
    mot: valueOf(motAttempt),
    fixture: demo,
  });
  if (!candidate) return err(combineFailures([vesAttempt, motAttempt], "registration"));

  addProviderWarnings(candidate, [
    ["dvla_ves", vesAttempt],
    ["dvsa_mot", motAttempt],
  ]);

  return ok({
    candidate,
    providers: { dvla_ves: report(vesAttempt), dvsa_mot: report(motAttempt) },
    demo,
  });
}

export async function lookupByVin(input: string, deps: LookupDeps): Promise<Result<LookupOutcome, LookupError>> {
  const vin = normaliseVin(input);
  if (!isPlausibleVin(vin)) {
    return err({
      code: "invalid_vin",
      status: 400,
      message: "A VIN is 17 characters and never contains the letters I, O or Q. Check it and try again.",
    });
  }
  if (vinRegion(vin) === "north_america" && !vinCheckDigitValid(vin)) {
    return err({
      code: "invalid_vin",
      status: 400,
      message:
        "The VIN's check digit does not match, which almost always means a typo. Compare it with the plate on the door pillar or the V5C.",
    });
  }

  const demo = usesFixtures(deps);
  let motAttempt: Attempt<MotVehicle>;
  let vpicAttempt: Attempt<VpicDecoded>;

  if (demo) {
    const fixture = VIN_FIXTURES[vin];
    motAttempt = fixtureAttempt("dvsa_mot", fixture?.mot);
    const decoded = fixture?.vpic ? decodeVpicRow(fixture.vpic, vin) : undefined;
    vpicAttempt = fixtureAttempt("nhtsa_vpic", decoded?.make ? decoded : undefined);
  } else {
    [motAttempt, vpicAttempt] = await Promise.all([
      deps.mot
        ? liveAttempt(() => fetchMotVehicleByVin(vin, deps.mot as MotCredentials, { fetchImpl: deps.fetchImpl }))
        : Promise.resolve(skipped<MotVehicle>("DVSA MOT credentials are not set")),
      liveAttempt(() => fetchVpicDecode(vin, { baseUrl: deps.vpicBaseUrl, fetchImpl: deps.fetchImpl })),
    ]);
  }

  const mot = valueOf(motAttempt);
  const vpic = valueOf(vpicAttempt);
  let candidate: VehicleCandidate | null = null;
  if (mot) {
    candidate = candidateFromUk({ registration: mot.registration ?? null, vin, mot, fixture: demo });
    if (candidate && vpic) candidate = supplementWithVpic(candidate, vpic);
  } else if (vpic) {
    candidate = candidateFromVpic(vpic, { fixture: demo });
  }
  if (!candidate) return err(combineFailures([motAttempt, vpicAttempt], "vin"));

  addProviderWarnings(candidate, [
    ["dvsa_mot", motAttempt],
    ["nhtsa_vpic", vpicAttempt],
  ]);

  return ok({
    candidate,
    providers: { dvsa_mot: report(motAttempt), nhtsa_vpic: report(vpicAttempt) },
    demo,
  });
}
