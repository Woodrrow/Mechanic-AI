import type { LookupOutcome } from "./lookup";

export type LookupRequest = { registration: string } | { vin: string };

export type LookupApiResponse =
  | ({ ok: true } & LookupOutcome)
  | { ok: false; error: { code: string; message: string } };

/** Browser-side call to the lookup route. Never throws. */
export async function lookupVehicle(body: LookupRequest): Promise<LookupApiResponse> {
  try {
    const res = await fetch("/api/vehicles/lookup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => null)) as LookupApiResponse | null;
    if (!json || typeof json !== "object" || !("ok" in json)) {
      return { ok: false, error: { code: "bad_response", message: `Unexpected response from the server (${res.status}).` } };
    }
    return json;
  } catch {
    return { ok: false, error: { code: "network", message: "Could not reach the server. Are you offline?" } };
  }
}
