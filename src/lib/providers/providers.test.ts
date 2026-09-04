import { beforeEach, describe, expect, it } from "vitest";
import { fetchVesVehicle } from "./dvla-ves";
import { fetchMotVehicleByRegistration, getMotAccessToken, resetMotTokenCache, type MotCredentials } from "./dvsa-mot";
import { kindFromStatus, parseRetryAfter } from "./errors";
import { REGISTRATION_FIXTURES } from "./fixtures";
import { decodeVpicRow, fetchVpicDecode, parseVpicErrorCodes } from "./nhtsa-vpic";

type Handler = (url: string, init?: RequestInit) => Response | Promise<Response>;

function fakeFetch(handler: Handler): typeof fetch {
  return (async (input: string | URL | Request, init?: RequestInit) =>
    handler(typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url, init)) as unknown as typeof fetch;
}

function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });
}

describe("errors", () => {
  it("maps statuses and retry-after", () => {
    expect(kindFromStatus(404)).toBe("not_found");
    expect(kindFromStatus(400)).toBe("bad_request");
    expect(kindFromStatus(403)).toBe("unauthorised");
    expect(kindFromStatus(429)).toBe("rate_limited");
    expect(kindFromStatus(503)).toBe("unavailable");
    expect(parseRetryAfter("30")).toBe(30);
    expect(parseRetryAfter(null)).toBeUndefined();
    expect(parseRetryAfter("garbage")).toBeUndefined();
  });
});

describe("DVLA VES client", () => {
  it("posts the registration with the api key and parses the vehicle", async () => {
    let captured: { url: string; init?: RequestInit } | null = null;
    const result = await fetchVesVehicle("AB15CDE", {
      apiKey: "k",
      fetchImpl: fakeFetch((url, init) => {
        captured = { url, init };
        return json(200, REGISTRATION_FIXTURES.AB15CDE.ves);
      }),
    });
    expect(captured!.url).toBe("https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles");
    expect(captured!.init?.method).toBe("POST");
    expect((captured!.init?.headers as Record<string, string>)["x-api-key"]).toBe("k");
    expect(JSON.parse(String(captured!.init?.body))).toEqual({ registrationNumber: "AB15CDE" });
    expect(result.ok && result.value.make).toBe("FORD");
  });

  it("maps DVLA's error envelope", async () => {
    const notFound = await fetchVesVehicle("AB15CDE", {
      apiKey: "k",
      fetchImpl: fakeFetch(() =>
        json(404, { errors: [{ status: "404", code: "404", title: "Vehicle Not Found", detail: "Record for vehicle not found" }] }),
      ),
    });
    expect(!notFound.ok && notFound.error.kind).toBe("not_found");
    expect(!notFound.ok && notFound.error.message).toBe("Record for vehicle not found");

    const forbidden = await fetchVesVehicle("AB15CDE", {
      apiKey: "bad",
      fetchImpl: fakeFetch(() => new Response("Forbidden", { status: 403 })),
    });
    expect(!forbidden.ok && forbidden.error.kind).toBe("unauthorised");

    const throttled = await fetchVesVehicle("AB15CDE", {
      apiKey: "k",
      fetchImpl: fakeFetch(() => json(429, { message: "Too Many Requests" }, { "retry-after": "12" })),
    });
    expect(!throttled.ok && throttled.error.kind).toBe("rate_limited");
    expect(!throttled.ok && throttled.error.retryAfterSeconds).toBe(12);
  });

  it("reports unexpected bodies and network failures without throwing", async () => {
    const bad = await fetchVesVehicle("AB15CDE", {
      apiKey: "k",
      fetchImpl: fakeFetch(() => new Response("<html>", { status: 200 })),
    });
    expect(!bad.ok && bad.error.kind).toBe("invalid_response");

    const shape = await fetchVesVehicle("AB15CDE", {
      apiKey: "k",
      fetchImpl: fakeFetch(() => json(200, { make: "FORD" })), // no registrationNumber
    });
    expect(!shape.ok && shape.error.kind).toBe("invalid_response");

    const network = await fetchVesVehicle("AB15CDE", {
      apiKey: "k",
      fetchImpl: fakeFetch(() => {
        throw new TypeError("fetch failed");
      }),
    });
    expect(!network.ok && network.error.kind).toBe("network");
  });
});

describe("DVSA MOT client", () => {
  const creds: MotCredentials = { clientId: "id", clientSecret: "secret", apiKey: "key" };

  beforeEach(() => resetMotTokenCache());

  it("fetches a token once and reuses it", async () => {
    let tokenCalls = 0;
    let lookupHeaders: Record<string, string> | undefined;
    const fetchImpl = fakeFetch((url, init) => {
      if (url.startsWith("https://login.microsoftonline.com/")) {
        tokenCalls += 1;
        const body = String(init?.body);
        expect(body).toContain("grant_type=client_credentials");
        expect(body).toContain(encodeURIComponent("https://tapi.dvsa.gov.uk/.default"));
        return json(200, { access_token: "tok", expires_in: 3599, token_type: "Bearer" });
      }
      lookupHeaders = init?.headers as Record<string, string>;
      expect(url).toBe("https://history.mot.api.gov.uk/v1/trade/vehicles/registration/AB15CDE");
      return json(200, REGISTRATION_FIXTURES.AB15CDE.mot);
    });

    const first = await fetchMotVehicleByRegistration("AB15CDE", creds, { fetchImpl });
    const second = await fetchMotVehicleByRegistration("AB15CDE", creds, { fetchImpl });
    expect(first.ok && first.value.model).toBe("FOCUS");
    expect(second.ok).toBe(true);
    expect(tokenCalls).toBe(1);
    expect(lookupHeaders?.authorization).toBe("Bearer tok");
    expect(lookupHeaders?.["x-api-key"]).toBe("key");
  });

  it("refreshes an expired token", async () => {
    let tokenCalls = 0;
    const fetchImpl = fakeFetch(() => {
      tokenCalls += 1;
      return json(200, { access_token: `tok${tokenCalls}`, expires_in: 3600 });
    });
    let now = 1_000_000;
    const a = await getMotAccessToken(creds, { fetchImpl }, () => now);
    now += 3600 * 1000; // past expiry
    const b = await getMotAccessToken(creds, { fetchImpl }, () => now);
    expect(a.ok && a.value).toBe("tok1");
    expect(b.ok && b.value).toBe("tok2");
  });

  it("treats a token failure as a credentials problem", async () => {
    const result = await fetchMotVehicleByRegistration("AB15CDE", creds, {
      fetchImpl: fakeFetch(() => json(401, { error: "invalid_client", error_description: "AADSTS7000215: Invalid client secret" })),
    });
    expect(!result.ok && result.error.kind).toBe("unauthorised");
    expect(!result.ok && result.error.message).toContain("Invalid client secret");
  });
});

describe("NHTSA vPIC client", () => {
  it("parses error codes", () => {
    expect(parseVpicErrorCodes("0")).toEqual([0]);
    expect(parseVpicErrorCodes("1,14")).toEqual([1, 14]);
    expect(parseVpicErrorCodes("")).toEqual([]);
    expect(parseVpicErrorCodes(null)).toEqual([]);
  });

  it("decodes the flat row", () => {
    const d = decodeVpicRow(
      { Make: "FORD", Model: "Focus", ModelYear: "2015", DisplacementCC: "2000", TransmissionStyle: "", ErrorCode: "0" },
      "1FADP3F27FL123456",
    );
    expect(d.make).toBe("FORD");
    expect(d.modelYear).toBe(2015);
    expect(d.displacementCc).toBe(2000);
    expect(d.transmissionStyle).toBeNull();
    expect(d.errorCodes).toEqual([0]);
  });

  it("calls DecodeVinValues and treats an empty Make as not found", async () => {
    let url = "";
    const found = await fetchVpicDecode("1FADP3F27FL123456", {
      fetchImpl: fakeFetch((u) => {
        url = u;
        return json(200, { Count: 1, Message: "ok", Results: [{ Make: "FORD", Model: "Focus", ErrorCode: "0" }] });
      }),
    });
    expect(url).toBe("https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/1FADP3F27FL123456?format=json");
    expect(found.ok && found.value.model).toBe("Focus");

    const missing = await fetchVpicDecode("ZZZZZZZZZZZZZZZZZ", {
      fetchImpl: fakeFetch(() => json(200, { Results: [{ Make: "", ErrorCode: "7", ErrorText: "7 - Manufacturer is not registered" }] })),
    });
    expect(!missing.ok && missing.error.kind).toBe("not_found");
  });
});
