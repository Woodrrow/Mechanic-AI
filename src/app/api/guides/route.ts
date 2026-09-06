import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getJob, isGuideable, jobAppliesToFuel } from "@/lib/jobs/catalogue";
import type { GuideRecord } from "@/lib/jobs/guide-schema";
import { getGuideStore } from "@/lib/jobs/guide-store";
import type { JobDefinition } from "@/lib/jobs/types";
import { resolveGuide, type SiblingMatch } from "@/lib/platforms/match";

export const dynamic = "force-dynamic";

const QuerySchema = z.object({
  job: z.string().min(1),
  make: z.string().min(1),
  model: z.string().optional(),
  year: z.coerce.number().int().optional(),
  engineCc: z.coerce.number().int().optional(),
  fuel: z.string().default("unknown"),
});

export type GuideMatchKind = "exact" | "sibling" | "none" | "refer_out" | "not_applicable" | "vehicle_incomplete";

export type GuideApiResponse =
  | {
      ok: true;
      job: JobDefinition;
      kind: GuideMatchKind;
      guide: GuideRecord | null;
      sibling: Omit<SiblingMatch, "guide"> | null;
    }
  | { ok: false; error: { code: string; message: string } };

export async function GET(request: NextRequest): Promise<NextResponse<GuideApiResponse>> {
  const parsed = QuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams.entries()));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: { code: "invalid_request", message: "job and make are required." } }, { status: 400 });
  }
  const job = getJob(parsed.data.job);
  if (!job) {
    return NextResponse.json({ ok: false, error: { code: "unknown_job", message: "No such job." } }, { status: 404 });
  }
  const { make, model, year, engineCc, fuel } = parsed.data;
  const base = { ok: true as const, job, guide: null, sibling: null };

  if (!jobAppliesToFuel(job, fuel)) return NextResponse.json({ ...base, kind: "not_applicable" });
  if (!isGuideable(job)) return NextResponse.json({ ...base, kind: "refer_out" });
  if (!model || !year) return NextResponse.json({ ...base, kind: "vehicle_incomplete" }, { headers: { "cache-control": "no-store" } });

  const lookup = { jobId: job.id, makeRaw: make, model, year, engineCc: engineCc ?? null, fuel };
  const resolution = resolveGuide(lookup, job, await getGuideStore().all());
  const headers = { "cache-control": "public, max-age=300" };

  if (resolution.kind === "exact") {
    return NextResponse.json({ ...base, kind: "exact", guide: resolution.guide }, { headers });
  }
  if (resolution.kind === "sibling") {
    const { guide, ...sibling } = resolution;
    return NextResponse.json({ ...base, kind: "sibling", guide, sibling }, { headers });
  }
  return NextResponse.json({ ...base, kind: "none" }, { headers });
}
