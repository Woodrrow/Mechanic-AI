"use client";

import Link from "next/link";
import type { JobDefinition } from "@/lib/jobs/types";
import { Badge, Card } from "./ui";

/**
 * RED tier: explain why it is genuinely dangerous, give a realistic price for
 * professional work, and decline to give a procedure. No amount of confidence
 * from the user changes this page.
 */
export function JobRefusal({ job, vehicleId }: { job: JobDefinition; vehicleId: string }) {
  const refusal = job.refusal;
  if (!refusal) return null;
  const { priceGbp, note } = refusal.professional;
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Badge tone="danger">Red</Badge>
        <span className="text-sm text-muted">We do not give a procedure for this</span>
      </div>

      <Card className="border-danger/40 bg-danger/5">
        <h2 className="text-lg font-bold text-danger">Why this one goes to a professional</h2>
        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm">
          {refusal.why.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="font-semibold">What it costs to have done</h2>
        <p className="mt-1 text-2xl font-bold">
          £{priceGbp.min}–{priceGbp.max}
        </p>
        <p className="mt-1 text-sm text-muted">{note}</p>
      </Card>

      <Card>
        <h2 className="font-semibold">What you can usefully do</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {refusal.whatYouCanDo.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      </Card>

      <Link href={`/garage/${vehicleId}/jobs`} className="inline-block text-sm font-semibold text-accent">
        ← Back to all jobs
      </Link>
    </div>
  );
}
