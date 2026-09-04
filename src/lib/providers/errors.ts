import type { z } from "zod";
import { err, ok, type Result } from "@/lib/result";

export type ProviderName = "dvla_ves" | "dvsa_mot" | "nhtsa_vpic";

export const PROVIDER_LABEL: Record<ProviderName, string> = {
  dvla_ves: "DVLA Vehicle Enquiry Service",
  dvsa_mot: "DVSA MOT History API",
  nhtsa_vpic: "NHTSA vPIC",
};

export type ProviderErrorKind =
  | "not_found"
  | "bad_request"
  | "unauthorised"
  | "rate_limited"
  | "unavailable"
  | "invalid_response"
  | "network"
  | "not_configured";

export class ProviderError extends Error {
  readonly provider: ProviderName;
  readonly kind: ProviderErrorKind;
  readonly status?: number;
  readonly retryAfterSeconds?: number;

  constructor(
    provider: ProviderName,
    kind: ProviderErrorKind,
    message: string,
    options: { status?: number; retryAfterSeconds?: number } = {},
  ) {
    super(message);
    this.name = "ProviderError";
    this.provider = provider;
    this.kind = kind;
    this.status = options.status;
    this.retryAfterSeconds = options.retryAfterSeconds;
  }
}

export function kindFromStatus(status: number): ProviderErrorKind {
  if (status === 404) return "not_found";
  if (status === 400 || status === 422) return "bad_request";
  if (status === 401 || status === 403) return "unauthorised";
  if (status === 429) return "rate_limited";
  return "unavailable";
}

export function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined;
  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.round(seconds);
  const date = Date.parse(header);
  if (!Number.isNaN(date)) return Math.max(0, Math.round((date - Date.now()) / 1000));
  return undefined;
}

/** Best-effort human-readable message from an error body of unknown shape. */
export async function readErrorDetail(res: Response): Promise<string> {
  const text = await res.text().catch(() => "");
  if (!text) return `HTTP ${res.status}`;
  try {
    const json: unknown = JSON.parse(text);
    if (json && typeof json === "object") {
      const obj = json as Record<string, unknown>;
      // DVLA VES: { errors: [{ status, code, title, detail }] }
      const errors = obj.errors;
      if (Array.isArray(errors) && errors[0] && typeof errors[0] === "object") {
        const first = errors[0] as Record<string, unknown>;
        const detail = first.detail ?? first.title ?? first.message;
        if (typeof detail === "string") return detail;
      }
      // DVSA MOT: { errorMessage, requestId }; generic: { message } / { error }
      for (const key of ["errorMessage", "message", "detail", "error_description", "error"]) {
        const v = obj[key];
        if (typeof v === "string") return v;
      }
    }
  } catch {
    // not JSON
  }
  return text.slice(0, 200);
}

export interface RequestJsonOptions<T> {
  provider: ProviderName;
  url: string;
  init: RequestInit;
  schema: z.ZodType<T>;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

/**
 * One HTTP round trip with every failure mode mapped to a ProviderError, so
 * callers never see a raw fetch exception or an unparsed body.
 */
export async function requestJson<T>(opts: RequestJsonOptions<T>): Promise<Result<T, ProviderError>> {
  const label = PROVIDER_LABEL[opts.provider];
  const fetchImpl = opts.fetchImpl ?? fetch;
  let res: Response;
  try {
    res = await fetchImpl(opts.url, {
      ...opts.init,
      signal: AbortSignal.timeout(opts.timeoutMs ?? 10_000),
    });
  } catch (cause) {
    const timedOut = cause instanceof Error && cause.name === "TimeoutError";
    return err(
      new ProviderError(
        opts.provider,
        timedOut ? "unavailable" : "network",
        timedOut ? `${label} did not respond in time.` : `Could not reach ${label}.`,
      ),
    );
  }

  if (!res.ok) {
    const detail = await readErrorDetail(res);
    return err(
      new ProviderError(opts.provider, kindFromStatus(res.status), detail, {
        status: res.status,
        retryAfterSeconds: parseRetryAfter(res.headers.get("retry-after")),
      }),
    );
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return err(new ProviderError(opts.provider, "invalid_response", `${label} returned a non-JSON body.`));
  }
  const parsed = opts.schema.safeParse(json);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return err(
      new ProviderError(
        opts.provider,
        "invalid_response",
        `${label} returned an unexpected shape: ${issue ? `${issue.path.join(".") || "(root)"} ${issue.message}` : "schema mismatch"}`,
      ),
    );
  }
  return ok(parsed.data);
}
