"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { JobAvailability, JobsApiResponse, JobSummary } from "@/app/api/jobs/route";
import { useVehicle } from "@/lib/garage/use-garage";
import { getJob, jobForDefect } from "@/lib/jobs/catalogue";
import { SYSTEM_LABEL } from "@/lib/jobs/types";
import { analyseHistory } from "@/lib/mot/history";
import { MotVehicleSchema } from "@/lib/providers/dvsa-mot";
import { vehicleTitle } from "@/lib/vehicle/format";
import { formatRegistration } from "@/lib/vehicle/registration";
import type { Vehicle } from "@/lib/vehicle/types";
import { Badge, Card, Plate } from "./ui";

const TIER_TONE = { green: "ok", amber: "warn", red: "danger" } as const;

const AVAILABILITY: Record<JobAvailability, { label: string; tone: "ok" | "accent" | "neutral" | "warn" | "danger" } | null> = {
  exact: { label: "Guide ready", tone: "ok" },
  sibling: { label: "Related car", tone: "accent" },
  none: null,
  refer_out: null,
  not_applicable: null,
  vehicle_incomplete: null,
};

function JobRow({ vehicleId, summary, suggested }: { vehicleId: string; summary: JobSummary; suggested: boolean }) {
  const { job, availability } = summary;
  const badge = AVAILABILITY[availability];
  const dim = availability === "none" || availability === "vehicle_incomplete";
  return (
    <li>
      <Link href={`/garage/${vehicleId}/jobs/${job.id}`} className="flex items-start justify-between gap-3 py-3">
        <div className={dim ? "opacity-70" : undefined}>
          <p className="font-medium">
            {job.title}
            {suggested ? <span className="ml-2 text-xs font-semibold text-accent">from your MOT</span> : null}
          </p>
          <p className="text-xs text-muted">{job.blurb}</p>
          {availability === "sibling" && summary.siblingOf ? (
            <p className="mt-0.5 text-xs text-accent">Guide written for the {summary.siblingOf}</p>
          ) : null}
          {availability === "none" ? <p className="mt-0.5 text-xs text-muted">No guide for your car yet</p> : null}
        </div>
        <span className="flex shrink-0 flex-col items-end gap-1">
          <Badge tone={TIER_TONE[job.tier]}>{job.tier}</Badge>
          {badge ? <Badge tone={badge.tone}>{badge.label}</Badge> : null}
        </span>
      </Link>
    </li>
  );
}

function query(vehicle: Vehicle): string {
  const params = new URLSearchParams({ make: vehicle.makeRaw, fuel: vehicle.fuel });
  if (vehicle.model) params.set("model", vehicle.model);
  if (vehicle.year) params.set("year", String(vehicle.year));
  if (vehicle.engineCc) params.set("engineCc", String(vehicle.engineCc));
  return params.toString();
}

export function JobsIndex({ vehicleId }: { vehicleId: string }) {
  const { vehicle, loading, error } = useVehicle(vehicleId);
  const [data, setData] = useState<JobsApiResponse | null>(null);

  useEffect(() => {
    if (!vehicle) return;
    let cancelled = false;
    fetch(`/api/jobs?${query(vehicle)}`)
      .then((r) => r.json() as Promise<JobsApiResponse>)
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setData({ ok: false, error: { code: "network", message: "Could not load the job list." } });
      });
    return () => {
      cancelled = true;
    };
  }, [vehicle]);

  const suggestions = useMemo(() => {
    const parsed = MotVehicleSchema.safeParse(vehicle?.sources.dvsaMot);
    const analysis = parsed.success ? analyseHistory(parsed.data) : null;
    if (!analysis) return new Map<string, string>();
    const map = new Map<string, string>();
    for (const item of analysis.openItems) {
      const job = jobForDefect(item.defect.explanation.ruleId, item.defect.location);
      if (job) map.set(job.id, item.defect.explanation.title);
    }
    return map;
  }, [vehicle]);

  if (loading) return <p className="text-muted">Loading…</p>;
  if (error) return <p role="alert" className="text-danger">{error}</p>;
  if (!vehicle) {
    return (
      <Card>
        <p className="font-semibold">That car is not in your garage.</p>
        <Link href="/" className="mt-2 inline-block text-sm font-semibold text-accent">
          Back to My Garage
        </Link>
      </Card>
    );
  }

  const title = vehicleTitle(vehicle) || "your car";
  const suggestedJobs = [...suggestions.keys()].map((id) => getJob(id)).filter((j): j is NonNullable<typeof j> => j !== null);

  return (
    <div className="space-y-5">
      <div>
        <Link href={`/garage/${vehicle.id}`} className="text-sm font-semibold text-accent">
          ← {title}
        </Link>
        <div className="mt-1 flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold">Jobs</h1>
          {vehicle.registration ? <Plate value={formatRegistration(vehicle.registration)} /> : null}
        </div>
        <p className="mt-1 text-sm text-muted">
          Every job is rated green, amber or red. Red jobs are ones we refuse to walk you through, and say why.
        </p>
      </div>

      {suggestedJobs.length > 0 ? (
        <Card className="border-accent/40">
          <h2 className="font-semibold">Suggested by your MOT record</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {suggestedJobs.map((job) => (
              <li key={job.id}>
                <Link href={`/garage/${vehicle.id}/jobs/${job.id}`} className="font-medium text-accent">
                  {job.title}
                </Link>
                <span className="text-muted"> · {suggestions.get(job.id)}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {!data ? <p className="text-muted">Checking which guides exist for your car…</p> : null}
      {data && !data.ok ? <p role="alert" className="text-danger">{data.error.message}</p> : null}
      {data && data.ok ? (
        <>
          {data.platforms.length > 0 ? (
            <Card>
              <p className="text-sm">
                Your car is a <span className="font-semibold">{data.platforms[0].member}</span> on the{" "}
                <span className="font-semibold">{data.platforms[0].name}</span> platform.
              </p>
              <p className="mt-1 text-xs text-muted">
                When there is no guide for your exact car we can use one written for a car that shares this platform, and we will say so
                at the top of the guide.
              </p>
            </Card>
          ) : null}

          {data.groups.map((group) => (
            <section key={group.system}>
              <h2 className="text-lg font-bold">{SYSTEM_LABEL[group.system]}</h2>
              <Card className="mt-2">
                <ul className="divide-y divide-border">
                  {group.jobs.map((summary) => (
                    <JobRow key={summary.job.id} vehicleId={vehicle.id} summary={summary} suggested={suggestions.has(summary.job.id)} />
                  ))}
                </ul>
              </Card>
            </section>
          ))}
        </>
      ) : null}
    </div>
  );
}
