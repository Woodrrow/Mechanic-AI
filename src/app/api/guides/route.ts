import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getJob } from "@/lib/jobs/catalogue";
import type { GuideRecord } from "@/lib/jobs/guide-schema";
import { getGuideStore } from "@/lib/jobs/guide-store";
import type { JobDefinition } from "@/lib/jobs/types";

export const dynamic = "force-dynamic";

const QuerySchema = z.object({
  job: z.string().min(1),
  make: z.string().min(1),
  model: z.string().optional(),
  year: z.coerce.number().int().optional(),
  engineCc: z.coerce.number().int().optional(),
  fuel: z.string().default("unknown"),
});

export type GuideApiResponse =
  | { ok: true; job: JobDefinition; guide: GuideRecord | null; reason?: "no_guide_for_vehicle" | "vehicle_incomplete" }
  | { ok: false; error: { code: string; message: string } };

export async function GET(request: NextRequest): Promise<NextResponse<GuideApiResponse>> {
  const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = QuerySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: { code: "invalid_request", message: "job and make are required." } }, { status: 400 });
  }
  const job = getJob(parsed.data.job);
  if (!job) {
    return NextResponse.json({ ok: false, error: { code: "unknown_job", message: "No such job." } }, { status: 404 });
  }
  const { make, model, year, engineCc, fuel } = parsed.data;
  if (!model || !year) {
    return NextResponse.json(
      { ok: true, job, guide: null, reason: "vehicle_incomplete" },
      { headers: { "cache-control": "no-store" } },
    );
  }
  const guide = await getGuideStore().find({
    jobId: job.id,
    makeRaw: make,
    model,
    year,
    engineCc: engineCc ?? null,
    fuel,
  });
  return NextResponse.json(
    guide ? { ok: true, job, guide } : { ok: true, job, guide: null, reason: "no_guide_for_vehicle" },
    { headers: { "cache-control": "public, max-age=300" } },
  );
}
