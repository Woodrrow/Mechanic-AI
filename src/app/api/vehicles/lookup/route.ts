import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { FixedWindowRateLimiter } from "@/lib/rate-limit";
import { lookupByRegistration, lookupByVin, lookupDepsFromEnv } from "@/lib/vehicle/lookup";
import type { LookupApiResponse } from "@/lib/vehicle/lookup-client";

export const dynamic = "force-dynamic";

// Per instance. Twelve lookups a minute is far more than a person needs and
// far less than would dent the DVLA quota.
const limiter = new FixedWindowRateLimiter({ windowMs: 60_000, max: 12 });

const LookupRequestSchema = z.union([
  z.object({ registration: z.string().trim().min(1).max(16) }),
  z.object({ vin: z.string().trim().min(1).max(32) }),
]);

function clientKey(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "anonymous"
  );
}

function failure(
  code: string,
  message: string,
  status: number,
  retryAfterSeconds?: number,
): NextResponse<LookupApiResponse> {
  return NextResponse.json(
    { ok: false, error: { code, message } },
    {
      status,
      headers: {
        "cache-control": "no-store",
        ...(retryAfterSeconds ? { "retry-after": String(retryAfterSeconds) } : {}),
      },
    },
  );
}

export async function POST(request: NextRequest): Promise<NextResponse<LookupApiResponse>> {
  const verdict = limiter.check(clientKey(request));
  if (!verdict.allowed) {
    return failure(
      "rate_limited",
      "Too many lookups from this device. Wait a minute and try again.",
      429,
      verdict.retryAfterSeconds,
    );
  }

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    // handled by the schema check below
  }
  const parsed = LookupRequestSchema.safeParse(body);
  if (!parsed.success) {
    return failure("invalid_request", 'Send JSON with either a "registration" or a "vin".', 400);
  }

  // Registration marks are personal data: they are never logged here.
  const deps = lookupDepsFromEnv();
  const result =
    "registration" in parsed.data
      ? await lookupByRegistration(parsed.data.registration, deps)
      : await lookupByVin(parsed.data.vin, deps);

  if (!result.ok) {
    const { code, message, status, retryAfterSeconds } = result.error;
    return failure(code, message, status, retryAfterSeconds);
  }
  return NextResponse.json({ ok: true, ...result.value }, { headers: { "cache-control": "no-store" } });
}
