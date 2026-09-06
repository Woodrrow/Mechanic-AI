import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { isGuideable, jobAppliesToFuel, jobsBySystem } from "@/lib/jobs/catalogue";
import { getGuideStore } from "@/lib/jobs/guide-store";
import type { JobDefinition, JobSystem } from "@/lib/jobs/types";
import { findMemberships, resolveGuide } from "@/lib/platforms/match";

export const dynamic = "force-dynamic";

const QuerySchema = z.object({
  make: z.string().min(1),
  model: z.string().optional(),
  year: z.coerce.number().int().optional(),
  engineCc: z.coerce.number().int().optional(),
  fuel: z.string().default("unknown"),
});

export type JobAvailability = "exact" | "sibling" | "none" | "refer_out" | "not_applicable" | "vehicle_incomplete";

export interface JobSummary {
  job: JobDefinition;
  availability: JobAvailability;
  siblingOf?: string;
}

export type JobsApiResponse =
  | {
      ok: true;
      groups: Array<{ system: JobSystem; jobs: JobSummary[] }>;
      platforms: Array<{ id: string; name: string; member: string; confidence: string }>;
    }
  | { ok: false; error: { code: string; message: string } };

export async function GET(request: NextRequest): Promise<NextResponse<JobsApiResponse>> {
  const parsed = QuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams.entries()));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: { code: "invalid_request", message: "make is required." } }, { status: 400 });
  }
  const { make, model, year, engineCc, fuel } = parsed.data;
  const guides = await getGuideStore().all();

  const groups = jobsBySystem().map(({ system, jobs }) => ({
    system,
    jobs: jobs
      .filter((job) => jobAppliesToFuel(job, fuel))
      .map((job): JobSummary => {
      if (!isGuideable(job)) return { job, availability: "refer_out" };
      if (!model || !year) return { job, availability: "vehicle_incomplete" };
      const resolution = resolveGuide({ jobId: job.id, makeRaw: make, model, year, engineCc: engineCc ?? null, fuel }, job, guides);
      if (resolution.kind === "exact") return { job, availability: "exact" };
      if (resolution.kind === "sibling") return { job, availability: "sibling", siblingOf: resolution.guideMember };
      return { job, availability: "none" };
    }),
  })).filter((group) => group.jobs.length > 0);

  const platforms = findMemberships(make, model ?? null, year ?? null).map((m) => ({
    id: m.platform.id,
    name: m.platform.name,
    member: m.member.name,
    confidence: m.platform.confidence,
  }));

  return NextResponse.json({ ok: true, groups, platforms }, { headers: { "cache-control": "public, max-age=300" } });
}
