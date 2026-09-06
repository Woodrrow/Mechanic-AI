"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { GuideApiResponse } from "@/app/api/guides/route";
import { useVehicle } from "@/lib/garage/use-garage";
import { relevantAdvisories } from "@/lib/jobs/advisories";
import type { ToolItem } from "@/lib/jobs/types";
import { analyseHistory } from "@/lib/mot/history";
import { MotVehicleSchema } from "@/lib/providers/dvsa-mot";
import { engineLitres, FUEL_LABEL, vehicleTitle } from "@/lib/vehicle/format";
import type { Vehicle } from "@/lib/vehicle/types";
import { Diagram } from "./diagrams";
import { JobRefusal } from "./job-refusal";
import { JobSafetyGate } from "./job-safety-gate";
import { SiblingBanner } from "./sibling-banner";
import { Badge, Card, Plate } from "./ui";
import { VideoEmbed } from "./video-embed";
import { formatRegistration } from "@/lib/vehicle/registration";

const TIER = {
  green: { label: "Green", tone: "ok" as const },
  amber: { label: "Amber", tone: "warn" as const },
  red: { label: "Red", tone: "danger" as const },
};

function price(t: { priceGbp?: { min: number; max: number } | null }): string | null {
  if (!t.priceGbp) return null;
  return t.priceGbp.min === t.priceGbp.max ? `about £${t.priceGbp.min}` : `£${t.priceGbp.min}–${t.priceGbp.max}`;
}

function ToolList({ items }: { items: Array<ToolItem | { name: string; why: string | null; priceGbp: { min: number; max: number } | null }> }) {
  return (
    <ul className="divide-y divide-border">
      {items.map((t) => (
        <li key={t.name} className="flex items-start justify-between gap-3 py-2 text-sm">
          <div>
            <p className="font-medium">{t.name}</p>
            {t.why ? <p className="text-xs text-muted">{t.why}</p> : null}
          </div>
          {price(t) ? <span className="shrink-0 text-xs text-muted">{price(t)}</span> : null}
        </li>
      ))}
    </ul>
  );
}

function guideQuery(vehicle: Vehicle, jobId: string): string {
  const params = new URLSearchParams({ job: jobId, make: vehicle.makeRaw, fuel: vehicle.fuel });
  if (vehicle.model) params.set("model", vehicle.model);
  if (vehicle.year) params.set("year", String(vehicle.year));
  if (vehicle.engineCc) params.set("engineCc", String(vehicle.engineCc));
  return params.toString();
}

export function JobGuide({ vehicleId, jobId }: { vehicleId: string; jobId: string }) {
  const { vehicle, loading, error } = useVehicle(vehicleId);
  const [response, setResponse] = useState<GuideApiResponse | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    if (!vehicle) return;
    let cancelled = false;
    fetch(`/api/guides?${guideQuery(vehicle, jobId)}`)
      .then((r) => r.json() as Promise<GuideApiResponse>)
      .then((json) => {
        if (!cancelled) setResponse(json);
      })
      .catch(() => {
        if (!cancelled) setResponse({ ok: false, error: { code: "network", message: "Could not load the guide." } });
      });
    return () => {
      cancelled = true;
    };
  }, [vehicle, jobId]);

  const analysis = useMemo(() => {
    const parsed = MotVehicleSchema.safeParse(vehicle?.sources.dvsaMot);
    return parsed.success ? analyseHistory(parsed.data) : null;
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
  if (!response) return <p className="text-muted">Loading the guide…</p>;
  if (!response.ok) return <p role="alert" className="text-danger">{response.error.message}</p>;

  const { job, guide, kind } = response;
  const title = vehicleTitle(vehicle) || "your car";
  const advisories = relevantAdvisories(analysis, job);
  const tier = TIER[job.tier];

  const header = (
    <div>
      <Link href={`/garage/${vehicle.id}`} className="text-sm font-semibold text-accent">
        ← {title}
      </Link>
      <div className="mt-1 flex items-start justify-between gap-3">
        <h1 className="text-2xl font-bold">{job.title}</h1>
        {vehicle.registration ? <Plate value={formatRegistration(vehicle.registration)} /> : null}
      </div>
      <p className="mt-1 text-sm text-muted">
        For your {title}
        {vehicle.engineCc ? `, ${engineLitres(vehicle.engineCc)}L ${FUEL_LABEL[vehicle.fuel].toLowerCase()}` : ""}.
      </p>
    </div>
  );

  if (kind === "refer_out") {
    return (
      <div className="space-y-5">
        {header}
        <JobRefusal job={job} vehicleId={vehicle.id} />
      </div>
    );
  }

  if (kind === "not_applicable") {
    return (
      <div className="space-y-5">
        {header}
        <Card>
          <p className="font-semibold">This job does not apply to your car</p>
          <p className="mt-1 text-sm text-muted">
            {job.title} is not a job on a {FUEL_LABEL[vehicle.fuel].toLowerCase()} car.
          </p>
          <Link href={`/garage/${vehicle.id}/jobs`} className="mt-3 inline-block text-sm font-semibold text-accent">
            ← Back to all jobs
          </Link>
        </Card>
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="space-y-5">
        {header}
        <Card>
          <p className="font-semibold">No guide yet for your exact car</p>
          <p className="mt-1 text-sm text-muted">
            {kind === "vehicle_incomplete"
              ? "We need the model and year to match a guide. Add them on the vehicle page."
              : `Guides are written for a specific model, year range and engine, generated offline and checked by a person before they are shown. There is no reviewed guide for a ${title}, or for a car that shares its platform, yet.`}
          </p>
          <p className="mt-3 text-xs text-muted">
            The generic safety rules and tool list for this job are below so you can plan, but there are no steps until a guide for your car exists.
          </p>
        </Card>
        <Card>
          <div className="flex items-center gap-2">
            <Badge tone={tier.tone}>{tier.label}</Badge>
            <span className="text-sm text-muted">
              Typically {job.typicalTimeMinutes.min}–{job.typicalTimeMinutes.max} minutes
            </span>
          </div>
          <h2 className="mt-3 font-semibold">Standard tools</h2>
          <ToolList items={job.baseTools} />
        </Card>
      </div>
    );
  }

  const siblingBanner =
    kind === "sibling" && response.sibling ? (
      <SiblingBanner
        sibling={{ ...response.sibling, scopeYears: `${guide.scope.yearFrom} to ${guide.scope.yearTo}` }}
        vehicleTitle={title}
      />
    ) : null;

  if (!acknowledged) {
    return (
      <div className="space-y-5">
        {header}
        {siblingBanner}
        <JobSafetyGate job={job} onAcknowledge={() => setAcknowledged(true)} />
      </div>
    );
  }

  const c = guide.content;
  return (
    <div className="space-y-5">
      {header}
      {siblingBanner}

      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={tier.tone}>{tier.label}</Badge>
          <Badge>Difficulty {c.difficulty}/5</Badge>
          <Badge>
            {c.timeMinutes.min}–{c.timeMinutes.max} min
          </Badge>
          {guide.generatedBy.provider !== "author" ? <Badge tone="accent">Generated · reviewed</Badge> : null}
        </div>
        <p className="mt-3 text-sm">{c.summary}</p>
        {guide.scope.variantNotes ? <p className="mt-2 text-xs text-muted">Covers: {guide.scope.variantNotes}</p> : null}
      </Card>

      {advisories.open.length > 0 || advisories.past.length > 0 ? (
        <Card className="border-accent/40">
          <h2 className="font-semibold">What your car&apos;s MOT record says</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {advisories.open.map((item) => (
              <li key={item.defect.key}>
                <span className="font-medium">{item.defect.explanation.title}</span>
                {item.defect.location.label ? ` (${item.defect.location.label.toLowerCase()})` : ""}: {item.status.text}
              </li>
            ))}
            {advisories.past.map((item, i) => (
              <li key={`${item.defect.key}-${i}`} className="text-muted">
                {item.defect.explanation.title} was noted in {item.notedAt.slice(0, 4)} and not mentioned at the next test.
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted">
            If discs were mentioned, check them closely at the inspection step. This box comes from your own record, not from the shared guide.
          </p>
        </Card>
      ) : null}

      <Card>
        <h2 className="font-semibold">Before you start: tools</h2>
        <ToolList items={[...job.baseTools, ...c.toolsExtra]} />
        <h3 className="mt-4 text-sm font-semibold">Consumables</h3>
        <ToolList items={job.consumables} />
        <h3 className="mt-4 text-sm font-semibold">Parts</h3>
        <ul className="divide-y divide-border">
          {c.partsNeeded.map((p) => (
            <li key={p.name} className="py-2 text-sm">
              <p className="font-medium">{p.name}</p>
              {p.notes ? <p className="text-xs text-muted">{p.notes}</p> : null}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">Prices are typical UK retail ranges to help you plan, not quotes.</p>
      </Card>

      <Card className="border-danger/40">
        <h2 className="font-semibold">Figures you must look up</h2>
        <p className="mt-1 text-sm text-muted">
          This guide does not state torque, capacity or wear figures it cannot source. Write these down from your manual before you start.
        </p>
        <ul className="mt-2 divide-y divide-border">
          {c.figures.map((f) => (
            <li key={f.name} className="py-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">{f.name}</span>
                <span className="font-mono text-xs">
                  {f.value === null ? `— ${f.unit}` : `${f.value} ${f.unit}`}
                </span>
              </div>
              <p className="text-xs text-muted">{f.note}</p>
            </li>
          ))}
        </ul>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">What it is and where it is</h2>
        <Card>
          <p className="text-sm">{c.partLocation}</p>
        </Card>
        {job.diagram ? <Diagram id={job.diagram} labels={c.diagramLabels} /> : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Steps</h2>
        <ol className="space-y-3">
          {c.steps.map((step, i) => (
            <li key={step.title} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs font-semibold text-muted">Step {i + 1}</p>
              <p className="font-semibold">{step.title}</p>
              <p className="mt-1 text-sm">{step.instruction}</p>
              {step.caution ? (
                <p className="mt-2 rounded-lg border border-danger/40 bg-danger/5 p-2 text-sm text-danger">
                  <span className="font-semibold">Caution: </span>
                  {step.caution}
                </p>
              ) : null}
              {step.checkpoint ? (
                <p className="mt-2 rounded-lg border border-ok/40 bg-ok/5 p-2 text-sm">
                  <span className="font-semibold text-ok">Check: </span>
                  {step.checkpoint}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      {c.gotchas.length > 0 ? (
        <Card className="border-warn/40 bg-warn-bg">
          <h2 className="font-semibold text-warn">Gotchas</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {c.gotchas.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card>
        <h2 className="font-semibold">Done correctly looks like this</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {c.verification.map((v) => (
            <li key={v}>{v}</li>
          ))}
        </ul>
        <h3 className="mt-4 text-sm font-semibold text-danger">If it does not</h3>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
          {c.ifWrong.map((v) => (
            <li key={v}>{v}</li>
          ))}
        </ul>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Watch someone do it</h2>
        <VideoEmbed guideId={guide.id} vehicleTitle={title} />
      </section>

      <Card>
        <p className="text-xs text-muted">
          Written for the {guide.scope.yearFrom}–{guide.scope.yearTo} {guide.scope.makeRaw} {guide.scope.modelRaw}
          {guide.scope.engineCc ? ` ${guide.scope.engineCc}cc` : ""} {guide.scope.fuel}. Guide {guide.id} v{guide.version},{" "}
          {guide.generatedBy.provider === "author" ? "written by hand" : `generated with ${guide.generatedBy.model}`} on{" "}
          {guide.generatedAt.slice(0, 10)}
          {guide.reviewedAt ? `, reviewed ${guide.reviewedAt.slice(0, 10)} by ${guide.reviewedBy}` : ""}. Confidence: {c.confidence}.
          Grounded on: {guide.grounding.slice(0, 5).join("; ")}.
        </p>
      </Card>
    </div>
  );
}
