import { describe, expect, it } from "vitest";
import { REGISTRATION_FIXTURES, US_FOCUS_VIN } from "@/lib/providers/fixtures";
import {
  isDemoRegistrationLookup,
  lookupByRegistration,
  lookupByVin,
  lookupDepsFromEnv,
  type LookupDeps,
} from "./lookup";

function fakeFetch(handler: (url: string, init?: RequestInit) => Response): typeof fetch {
  return (async (input: string | URL | Request, init?: RequestInit) =>
    handler(typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url, init)) as unknown as typeof fetch;
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const demo: LookupDeps = { useFixtures: true };

describe("lookupDepsFromEnv", () => {
  it("reads keys and detects demo mode", () => {
    expect(isDemoRegistrationLookup(lookupDepsFromEnv({}))).toBe(true);
    expect(isDemoRegistrationLookup(lookupDepsFromEnv({ DVLA_VES_API_KEY: "k" }))).toBe(false);
    expect(isDemoRegistrationLookup(lookupDepsFromEnv({ DVLA_VES_API_KEY: "k", POCKET_MECHANIC_USE_FIXTURES: "1" }))).toBe(true);
    const deps = lookupDepsFromEnv({
      DVSA_MOT_CLIENT_ID: "a",
      DVSA_MOT_CLIENT_SECRET: "b",
      DVSA_MOT_API_KEY: "c",
    });
    expect(deps.mot?.clientId).toBe("a");
    expect(isDemoRegistrationLookup(deps)).toBe(false);
    expect(lookupDepsFromEnv({ DVSA_MOT_CLIENT_ID: "a" }).mot).toBeUndefined();
  });
});

describe("lookupByRegistration (demo)", () => {
  it("returns a merged candidate for a demo plate", async () => {
    const result = await lookupByRegistration("ab15 cde", demo);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.demo).toBe(true);
    expect(result.value.candidate.model).toBe("Focus");
    expect(result.value.candidate.sources.fixture).toBe(true);
    expect(result.value.providers.dvla_ves?.status).toBe("fixture");
    expect(result.value.providers.dvsa_mot?.status).toBe("fixture");
  });

  it("degrades to DVLA-only when DVSA has no record", async () => {
    const result = await lookupByRegistration("AA19AAA", demo);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.candidate.model).toBeNull();
    expect(result.value.providers.dvsa_mot?.status).toBe("failed");
    expect(result.value.candidate.warnings).toContain("No DVSA MOT record was found for this vehicle.");
  });

  it("maps error plates to lookup errors", async () => {
    const nfd = await lookupByRegistration("ER19NFD", demo);
    expect(!nfd.ok && nfd.error.code).toBe("vehicle_not_found");
    expect(!nfd.ok && nfd.error.status).toBe(404);

    const thr = await lookupByRegistration("ER19THR", demo);
    expect(!thr.ok && thr.error.code).toBe("rate_limited");
    expect(!thr.ok && thr.error.retryAfterSeconds).toBe(30);

    const bad = await lookupByRegistration("ER19BAD", demo);
    expect(!bad.ok && bad.error.code).toBe("invalid_registration");

    const unknown = await lookupByRegistration("ZZ99ZZZ", demo);
    expect(!unknown.ok && unknown.error.code).toBe("vehicle_not_found");
  });

  it("rejects implausible input before calling anything", async () => {
    const result = await lookupByRegistration("not a plate", demo);
    expect(!result.ok && result.error.code).toBe("invalid_registration");
  });
});

describe("lookupByRegistration (live)", () => {
  it("queries DVLA live, skips DVSA when unconfigured, and says so", async () => {
    const calls: string[] = [];
    const result = await lookupByRegistration("AB15CDE", {
      vesApiKey: "k",
      fetchImpl: fakeFetch((url) => {
        calls.push(url);
        return json(200, REGISTRATION_FIXTURES.AB15CDE.ves);
      }),
    });
    expect(calls).toHaveLength(1);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.demo).toBe(false);
    expect(result.value.candidate.sources.fixture).toBeUndefined();
    expect(result.value.providers.dvla_ves?.status).toBe("live");
    expect(result.value.providers.dvsa_mot?.status).toBe("skipped");
    expect(result.value.candidate.needsConfirmation).toContain("model");
    expect(result.value.candidate.warnings.some((w) => w.includes("was not queried"))).toBe(true);
  });

  it("still succeeds from DVSA alone when DVLA returns 404", async () => {
    const result = await lookupByRegistration("AB15CDE", {
      vesApiKey: "k",
      mot: { clientId: "a", clientSecret: "b", apiKey: "c" },
      fetchImpl: fakeFetch((url) => {
        if (url.includes("login.microsoftonline.com")) return json(200, { access_token: "t", expires_in: 3600 });
        if (url.includes("driver-vehicle-licensing")) return json(404, { errors: [{ detail: "Record for vehicle not found" }] });
        return json(200, REGISTRATION_FIXTURES.AB15CDE.mot);
      }),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.candidate.make).toBe("Ford");
    expect(result.value.candidate.model).toBe("Focus");
    expect(result.value.providers.dvla_ves?.status).toBe("failed");
    expect(result.value.candidate.warnings.some((w) => w.startsWith("DVLA Vehicle Enquiry Service:"))).toBe(true);
  });

  it("reports a misconfigured key rather than 'not found'", async () => {
    const result = await lookupByRegistration("AB15CDE", {
      vesApiKey: "bad",
      fetchImpl: fakeFetch(() => new Response("Forbidden", { status: 403 })),
    });
    expect(!result.ok && result.error.code).toBe("provider_misconfigured");
    expect(!result.ok && result.error.status).toBe(502);
  });
});

describe("lookupByVin", () => {
  it("validates shape and check digit", async () => {
    const short = await lookupByVin("WF0DXXGCBDFE1234", demo);
    expect(!short.ok && short.error.code).toBe("invalid_vin");

    const typo = US_FOCUS_VIN.slice(0, 8) + (US_FOCUS_VIN.charAt(8) === "0" ? "1" : "0") + US_FOCUS_VIN.slice(9);
    const badDigit = await lookupByVin(typo, demo);
    expect(!badDigit.ok && badDigit.error.code).toBe("invalid_vin");
    expect(!badDigit.ok && badDigit.error.message).toMatch(/check digit/);
  });

  it("decodes a US VIN via vPIC fixtures", async () => {
    const result = await lookupByVin(US_FOCUS_VIN.toLowerCase(), demo);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.candidate.country).toBe("US");
    expect(result.value.candidate.model).toBe("Focus");
    expect(result.value.providers.nhtsa_vpic?.status).toBe("fixture");
    expect(result.value.providers.dvsa_mot?.status).toBe("failed");
  });

  it("prefers the DVSA record for a UK-registered European VIN", async () => {
    const result = await lookupByVin("WF0DXXGCBDFE12345", demo);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.candidate.country).toBe("GB");
    expect(result.value.candidate.registration).toBe("AB15CDE");
    expect(result.value.candidate.vin).toBe("WF0DXXGCBDFE12345");
    expect(result.value.candidate.model).toBe("Focus");
    expect(result.value.candidate.sources.nhtsaVpic).toBeDefined();
  });

  it("goes live to vPIC by default and returns not found for an unknown VIN", async () => {
    const result = await lookupByVin("WF0DXXGCBDFE12345", {
      fetchImpl: fakeFetch(() => json(200, { Results: [{ Make: "", ErrorCode: "7", ErrorText: "7 - Manufacturer is not registered" }] })),
    });
    expect(!result.ok && result.error.code).toBe("vehicle_not_found");
  });
});
