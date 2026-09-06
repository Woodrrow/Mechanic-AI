"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useVehicle } from "@/lib/garage/use-garage";
import { analyseHistory } from "@/lib/mot/history";
import { mergeRefresh } from "@/lib/mot/refresh";
import {
  CATEGORY_LABEL,
  type DefectType,
  type ExplainedDefect,
  type JobTier,
  type JobVenue,
  type OpenItem,
  type ParsedTest,
  type ResolvedItem,
} from "@/lib/mot/types";
import { MotVehicleSchema } from "@/lib/providers/dvsa-mot";
import { jobForDefect } from "@/lib/jobs/catalogue";
import { motSummary, vehicleTitle } from "@/lib/vehicle/format";
import { lookupVehicle } from "@/lib/vehicle/lookup-client";
import { formatRegistration } from "@/lib/vehicle/registration";
import type { Vehicle } from "@/lib/vehicle/types";
import { Badge, Button, Card, Plate } from "./ui";

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const monthFormat = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric" });

function formatDate(iso: string): string {
  return dateFormat.format(new Date(iso));
}

function formatMonth(iso: string): string {
  return monthFormat.format(new Date(iso));
}

const TIER: Record<JobTier, { label: string; tone: "ok" | "warn" | "danger"; hint: string }> = {
  green: { label: "Green", tone: "ok", hint: "Beginner-safe" },
  amber: { label: "Amber", tone: "warn", hint: "Doable at home with care and the right kit" },
  red: { label: "Red", tone: "danger", hint: "Leave this to a professional" },
};

const VENUE: Record<JobVenue, string> = {
  home: "At home",
  garage: "Garage job",
  tyre_shop: "Tyre shop",
  windscreen: "Windscreen specialist",
};

const TYPE: Record<DefectType, { label: string; tone: "neutral" | "ok" | "warn" | "danger" }> = {
  advisory: { label: "Advisory", tone: "neutral" },
  minor: { label: "Minor", tone: "warn" },
  major: { label: "Major", tone: "danger" },
  dangerous: { label: "Dangerous", tone: "danger" },
  fail: { label: "Fail", tone: "danger" },
  prs: { label: "Fixed at test", tone: "ok" },
  user_entered: { label: "Note", tone: "neutral" },
  other: { label: "Note", tone: "neutral" },
};

const STATUS_CLASS: Record<string, string> = {
  ok: "text-ok",
  warn: "text-warn",
  danger: "text-danger",
  neutral: "text-muted",
};

function DefectTitle({ defect }: { defect: ExplainedDefect }) {
  return (
    <p className="font-semibold">
      {defect.explanation.title}
      {defect.location.label ? <span className="block text-sm font-normal text-muted">{defect.location.label}</span> : null}
    </p>
  );
}

function TestersWords({ defect }: { defect: ExplainedDefect }) {
  return (
    <details className="mt-2 text-xs text-muted">
      <summary className="cursor-pointer">Tester&apos;s words</summary>
      <p className="mt-1 font-mono">{defect.raw}</p>
    </details>
  );
}

function OpenItemCard({ item, vehicleId }: { item: OpenItem; vehicleId: string }) {
  const { defect } = item;
  const { explanation } = defect;
  const job = explanation.job;
  const catalogueJob = jobForDefect(explanation.ruleId, defect.location);
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{CATEGORY_LABEL[defect.category]}</Badge>
        <Badge tone={TYPE[defect.type].tone}>{TYPE[defect.type].label}</Badge>
      </div>
      <div className="mt-2">
        <DefectTitle defect={defect} />
        <p className={`mt-1 text-sm font-medium ${STATUS_CLASS[item.status.tone]}`}>{item.status.text}</p>
      </div>
      <p className="mt-3 text-sm">{explanation.meaning}</p>
      {explanation.whyItMatters ? <p className="mt-2 text-sm text-muted">{explanation.whyItMatters}</p> : null}
      {job ? (
        <div className="mt-3 rounded-xl border border-border bg-background p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={TIER[job.tier].tone} title={TIER[job.tier].hint}>
              {TIER[job.tier].label}
            </Badge>
            <span className="text-xs text-muted">{VENUE[job.where]}</span>
          </div>
          <p className="mt-1 font-semibold">{job.name}</p>
          <p className="mt-1 text-sm text-muted">{job.summary}</p>
          {catalogueJob ? (
            <Link href={`/garage/${vehicleId}/jobs/${catalogueJob.id}`} className="mt-2 inline-block text-sm font-semibold text-accent">
              Open the {catalogueJob.title.toLowerCase()} guide →
            </Link>
          ) : (
            <p className="mt-2 text-xs text-muted">No step-by-step guide for this job yet.</p>
          )}
        </div>
      ) : null}
      {item.timesNoted > 1 ? (
        <p className="mt-3 text-xs text-muted">
          Noted at {item.timesNoted} tests, the first in {formatMonth(item.firstNoted)}.
        </p>
      ) : null}
      <TestersWords defect={defect} />
    </Card>
  );
}

function resolvedText(item: ResolvedItem): string {
  if (item.atStation) return `Found at the ${formatDate(item.notedAt)} test and fixed there and then.`;
  const failed = item.defect.type === "major" || item.defect.type === "dangerous" || item.defect.type === "fail";
  if (failed) {
    return item.sameDay
      ? `Failed on this on ${formatDate(item.notedAt)}, then fixed and passed the same day.`
      : `Failed on this on ${formatDate(item.notedAt)}, then passed on ${formatDate(item.clearedAt)}.`;
  }
  if (item.sameDay) return `Noted at the failed test on ${formatDate(item.notedAt)} and gone by the retest the same day.`;
  return `Noted ${formatDate(item.notedAt)}; not mentioned at the ${formatDate(item.clearedAt)} test, so probably fixed or replaced.`;
}

function TestCard({ test }: { test: ParsedTest }) {
  return (
    <li className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold">{formatDate(test.completedDate)}</p>
          <p className="text-xs text-muted">
            {[test.odometerRaw, test.expiryDate ? `valid to ${test.expiryDate}` : null].filter(Boolean).join(" · ")}
          </p>
        </div>
        <Badge tone={test.result === "passed" ? "ok" : "danger"}>{test.result === "passed" ? "Pass" : "Fail"}</Badge>
      </div>
      {test.defects.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {test.defects.map((d, i) => (
            <li key={`${d.key}-${i}`} className="text-sm">
              <div className="flex items-start justify-between gap-2">
                <span>
                  {d.explanation.title}
                  {d.location.label ? <span className="text-muted"> · {d.location.label}</span> : null}
                </span>
                <Badge tone={TYPE[d.type].tone}>{TYPE[d.type].label}</Badge>
              </div>
              <p className="mt-0.5 font-mono text-[11px] text-muted">{d.raw}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted">Nothing noted.</p>
      )}
    </li>
  );
}

function EmptyHistory({
  vehicle,
  canRefresh,
  refreshing,
  onRefresh,
}: {
  vehicle: Vehicle;
  canRefresh: boolean;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const due = vehicle.uk?.motTestDueDate;
  return (
    <Card>
      <p className="font-semibold">No MOT history stored for this car</p>
      <p className="mt-1 text-sm text-muted">
        {due
          ? `Its first MOT is due by ${due}, so there is nothing on record yet. Once it has been tested, the advisories will appear here.`
          : vehicle.registration
            ? "This car was typed in rather than looked up, so we have not fetched its DVSA record yet."
            : "This car has no registration saved, and the DVSA record is keyed on the registration."}
      </p>
      {!due && vehicle.registration ? (
        canRefresh ? (
          <Button className="mt-4" variant="secondary" onClick={onRefresh} disabled={refreshing}>
            {refreshing ? "Fetching…" : "Fetch from DVSA"}
          </Button>
        ) : (
          <p className="mt-3 text-xs text-muted">
            The DVSA connection is not set up on this server yet. This button appears as soon as it is.
          </p>
        )
      ) : null}
    </Card>
  );
}

export function VehicleHistory({ id, canRefresh }: { id: string; canRefresh: boolean }) {
  const { vehicle, loading, error, update, reload } = useVehicle(id);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState<{ text: string; tone: "ok" | "warn" | "danger" } | null>(null);

  const mot = useMemo(() => {
    const parsed = MotVehicleSchema.safeParse(vehicle?.sources.dvsaMot);
    return parsed.success ? parsed.data : null;
  }, [vehicle]);
  const analysis = useMemo(() => analyseHistory(mot), [mot]);

  async function refresh() {
    if (!vehicle?.registration) return;
    setRefreshing(true);
    setNotice(null);
    const response = await lookupVehicle({ registration: vehicle.registration });
    if (!response.ok) {
      setNotice({ text: response.error.message, tone: "danger" });
      setRefreshing(false);
      return;
    }
    const patch = mergeRefresh(vehicle, response.candidate);
    if (!patch) {
      setNotice({ text: "DVSA has no MOT record for this registration.", tone: "warn" });
      setRefreshing(false);
      return;
    }
    try {
      await update(patch);
      reload();
      setNotice({ text: response.demo ? "Updated from the demo fixtures." : "Updated from DVSA.", tone: "ok" });
    } catch (e) {
      setNotice({ text: e instanceof Error ? e.message : "Could not save the update.", tone: "danger" });
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) return <p className="text-muted">Loading…</p>;
  if (error) {
    return (
      <p role="alert" className="text-danger">
        {error}
      </p>
    );
  }
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

  const mot_ = motSummary(vehicle.uk);
  const passes = analysis?.tests.filter((t) => t.result === "passed").length ?? 0;
  const fails = (analysis?.testCount ?? 0) - passes;
  const fetched = vehicle.sources.fetchedAt ?? vehicle.createdAt;

  return (
    <div className="space-y-5">
      <div>
        <Link href={`/garage/${vehicle.id}`} className="text-sm font-semibold text-accent">
          ← {vehicleTitle(vehicle) || "Your car"}
        </Link>
        <div className="mt-1 flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold">Your car&apos;s history</h1>
          {vehicle.registration ? <Plate value={formatRegistration(vehicle.registration)} /> : null}
        </div>
        <p className="mt-1 text-sm text-muted">
          Every MOT tester writes down what is starting to fail. This is that record, in plain English.
        </p>
      </div>

      {!analysis || analysis.testCount === 0 ? (
        <EmptyHistory vehicle={vehicle} canRefresh={canRefresh} refreshing={refreshing} onRefresh={refresh} />
      ) : (
        <>
          <Card>
            <div className="flex flex-wrap gap-2">
              {mot_ ? <Badge tone={mot_.tone === "neutral" ? "neutral" : mot_.tone}>{mot_.short}</Badge> : null}
              {vehicle.uk?.hasOutstandingRecall && vehicle.uk.hasOutstandingRecall.toLowerCase() !== "no" ? (
                <Badge tone="danger">Recall: {vehicle.uk.hasOutstandingRecall}</Badge>
              ) : null}
              {vehicle.sources.fixture ? <Badge tone="accent">Demo data</Badge> : null}
            </div>
            <p className="mt-3 text-sm">
              <span className="font-semibold">{analysis.testCount} MOT tests</span> since{" "}
              {analysis.firstTestDate ? formatMonth(analysis.firstTestDate) : "?"}: {passes} passed, {fails} failed.
            </p>
            <p className="mt-1 text-sm text-muted">
              {[
                analysis.latestMileage !== null ? `Last recorded at ${analysis.latestMileage.toLocaleString("en-GB")} miles` : null,
                analysis.milesPerYear ? `about ${analysis.milesPerYear.toLocaleString("en-GB")} miles a year` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </Card>

          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-bold">Look at these now</h2>
              <p className="text-sm text-muted">
                {analysis.openItems.length > 0
                  ? `Raised at the ${formatDate(analysis.latestTest!.completedDate)} test and still open as far as we know.`
                  : `Nothing was noted at the ${formatDate(analysis.latestTest!.completedDate)} test.`}
              </p>
            </div>
            {analysis.openItems.map((item) => (
              <OpenItemCard key={item.defect.key} item={item} vehicleId={vehicle.id} />
            ))}
          </section>

          {analysis.resolvedItems.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-lg font-bold">Dealt with along the way</h2>
              <Card>
                <ul className="divide-y divide-border">
                  {analysis.resolvedItems.slice(0, 12).map((item, i) => (
                    <li key={`${item.defect.key}-${item.notedAt}-${i}`} className="py-2 text-sm">
                      <DefectTitle defect={item.defect} />
                      <p className="text-muted">{resolvedText(item)}</p>
                    </li>
                  ))}
                </ul>
              </Card>
            </section>
          ) : null}

          <section className="space-y-3">
            <h2 className="text-lg font-bold">Every test</h2>
            <ul className="space-y-3">
              {analysis.tests.map((test) => (
                <TestCard key={test.id} test={test} />
              ))}
            </ul>
          </section>

          <Card>
            <p className="text-xs text-muted">
              Source: DVSA MOT history{vehicle.sources.fixture ? " (demo fixtures)" : ""}, fetched {formatDate(fetched)}.
              Advisories are the tester&apos;s judgement on the day; &quot;probably worse&quot; estimates use your mileage, not an inspection.
            </p>
            {vehicle.registration ? (
              canRefresh ? (
                <Button className="mt-3" variant="secondary" onClick={refresh} disabled={refreshing}>
                  {refreshing ? "Updating…" : "Update from DVSA"}
                </Button>
              ) : (
                <p className="mt-2 text-xs text-muted">Updates will be available once the DVSA connection is set up.</p>
              )
            ) : null}
          </Card>
        </>
      )}

      {notice ? (
        <p role="status" className={`text-sm font-medium ${STATUS_CLASS[notice.tone]}`}>
          {notice.text}
        </p>
      ) : null}
    </div>
  );
}
