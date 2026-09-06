"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { DiagnoseApiResponse } from "@/app/api/diagnose/route";
import { useVehicle } from "@/lib/garage/use-garage";
import { CATEGORY_LABEL, type SymptomDefinition } from "@/lib/diagnose/types";
import { searchSymptoms, symptomsByCategory } from "@/lib/diagnose/symptoms";
import { getJob } from "@/lib/jobs/catalogue";
import { vehicleTitle } from "@/lib/vehicle/format";
import { formatRegistration } from "@/lib/vehicle/registration";
import { Badge, Button, Card, Plate } from "./ui";

type Step = { name: "pick" } | { name: "interview"; symptom: SymptomDefinition } | { name: "result"; symptom: SymptomDefinition };

const CONFIDENCE_TONE = { likely: "danger", possible: "warn", "less likely": "neutral" } as const;
const TIER_TONE = { green: "ok", amber: "warn", red: "danger" } as const;

function SymptomPicker({ onPick }: { onPick: (s: SymptomDefinition) => void }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => (query.trim() ? searchSymptoms(query) : null), [query]);

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium">Describe what the car is doing</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. grinding when I brake"
          className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-3 text-base outline-none focus:border-accent"
        />
      </label>

      {results ? (
        results.length > 0 ? (
          <Card>
            <ul className="divide-y divide-border">
              {results.map((symptom) => (
                <li key={symptom.id}>
                  <button type="button" onClick={() => onPick(symptom)} className="w-full py-3 text-left">
                    <p className="font-medium">{symptom.label}</p>
                    <p className="text-xs text-muted">{symptom.blurb}</p>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <Card>
            <p className="text-sm">
              Nothing here matches that yet. Try different words, or browse the list below. If the car is unsafe to drive, do not drive it.
            </p>
          </Card>
        )
      ) : (
        symptomsByCategory().map((group) => (
          <section key={group.category}>
            <h2 className="text-lg font-bold">{CATEGORY_LABEL[group.category]}</h2>
            <Card className="mt-2">
              <ul className="divide-y divide-border">
                {group.symptoms.map((symptom) => (
                  <li key={symptom.id}>
                    <button type="button" onClick={() => onPick(symptom)} className="w-full py-3 text-left">
                      <p className="font-medium">{symptom.label}</p>
                      <p className="text-xs text-muted">{symptom.blurb}</p>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        ))
      )}
    </div>
  );
}

export function DiagnoseFlow({ vehicleId }: { vehicleId: string }) {
  const { vehicle, loading, error } = useVehicle(vehicleId);
  const [step, setStep] = useState<Step>({ name: "pick" });
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [codeInput, setCodeInput] = useState("");
  const [response, setResponse] = useState<DiagnoseApiResponse | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(symptom: SymptomDefinition, nextAnswers: Record<string, string | string[]>, codes: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ symptomId: symptom.id, answers: nextAnswers, codes, motRecord: vehicle?.sources.dvsaMot }),
      });
      setResponse((await res.json()) as DiagnoseApiResponse);
      setStep({ name: "result", symptom });
    } catch {
      setResponse({ ok: false, error: { code: "network", message: "Could not reach the server." } });
    } finally {
      setBusy(false);
    }
  }

  function pick(symptom: SymptomDefinition) {
    setAnswers({});
    setResponse(null);
    if (symptom.questions.length === 0) {
      void run(symptom, {}, codeInput);
    } else {
      setStep({ name: "interview", symptom });
    }
  }

  function restart() {
    setAnswers({});
    setResponse(null);
    setStep({ name: "pick" });
  }

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
  const header = (
    <div>
      <Link href={`/garage/${vehicle.id}`} className="text-sm font-semibold text-accent">
        ← {title}
      </Link>
      <div className="mt-1 flex items-start justify-between gap-3">
        <h1 className="text-2xl font-bold">Diagnose</h1>
        {vehicle.registration ? <Plate value={formatRegistration(vehicle.registration)} /> : null}
      </div>
    </div>
  );

  if (step.name === "pick") {
    return (
      <div className="space-y-5">
        {header}
        <p className="text-sm text-muted">
          Tell us what the car is doing and we will narrow it down. Nothing here replaces a proper inspection, and we will say when
          something needs one.
        </p>
        <SymptomPicker onPick={pick} />
        <Card>
          <h2 className="font-semibold">Have a fault code?</h2>
          <p className="mt-1 text-sm text-muted">
            If you have a cheap OBD-II reader, paste the codes here and they will be used as evidence. Type them like P0300.
          </p>
          <input
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            placeholder="P0300, P0171"
            className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-3 font-mono text-base uppercase outline-none focus:border-accent"
          />
        </Card>
      </div>
    );
  }

  if (step.name === "interview") {
    const { symptom } = step;
    const allAnswered = symptom.questions.every((q) => answers[q.id] !== undefined);
    return (
      <div className="space-y-5">
        {header}
        <div>
          <h2 className="text-xl font-bold">{symptom.label}</h2>
          <p className="text-sm text-muted">{symptom.blurb}</p>
        </div>
        {symptom.questions.map((question) => {
          const current = answers[question.id];
          return (
            <Card key={question.id}>
              <fieldset>
                <legend className="font-semibold">{question.ask}</legend>
                {question.why ? <p className="mt-1 text-xs text-muted">{question.why}</p> : null}
                <div className="mt-3 space-y-2">
                  {question.options.map((option) => {
                    const selected = question.multi
                      ? Array.isArray(current) && current.includes(option.id)
                      : current === option.id;
                    return (
                      <label
                        key={option.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm ${
                          selected ? "border-accent bg-accent/10 font-medium" : "border-border"
                        }`}
                      >
                        <input
                          type={question.multi ? "checkbox" : "radio"}
                          name={question.id}
                          checked={selected}
                          onChange={() => {
                            setAnswers((prev) => {
                              if (!question.multi) return { ...prev, [question.id]: option.id };
                              const list = Array.isArray(prev[question.id]) ? (prev[question.id] as string[]) : [];
                              return {
                                ...prev,
                                [question.id]: list.includes(option.id) ? list.filter((v) => v !== option.id) : [...list, option.id],
                              };
                            });
                          }}
                          className="mt-0.5 h-4 w-4"
                        />
                        <span>
                          {option.label}
                          {option.hint ? <span className="block text-xs text-muted">{option.hint}</span> : null}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </Card>
          );
        })}
        <Button onClick={() => void run(symptom, answers, codeInput)} disabled={busy}>
          {busy ? "Working it out…" : allAnswered ? "See what it could be" : "See what it could be so far"}
        </Button>
        <Button variant="secondary" onClick={restart} disabled={busy}>
          Choose a different symptom
        </Button>
      </div>
    );
  }

  // result
  if (!response) return <p className="text-muted">Working it out…</p>;
  if (!response.ok) {
    return (
      <div className="space-y-5">
        {header}
        <p role="alert" className="text-danger">
          {response.error.message}
        </p>
        <Button variant="secondary" onClick={restart}>
          Start again
        </Button>
      </div>
    );
  }

  const { result, codes } = response;
  return (
    <div className="space-y-5">
      {header}
      <div>
        <h2 className="text-xl font-bold">{result.symptom.label}</h2>
        <p className="text-sm text-muted">
          {result.answered} of {result.totalQuestions} questions answered. These are possibilities in order, not a diagnosis.
        </p>
      </div>

      {result.safetyStop ? (
        <Card className="border-danger/50 bg-danger/5">
          <h3 className="text-lg font-bold text-danger">{result.safetyStop.title}</h3>
          {result.safetyStop.body.map((line) => (
            <p key={line} className="mt-2 text-sm">
              {line}
            </p>
          ))}
        </Card>
      ) : null}

      {codes.codes.length > 0 || codes.unrecognised.length > 0 ? (
        <Card>
          <h3 className="font-semibold">Your fault codes</h3>
          <ul className="mt-2 divide-y divide-border">
            {codes.codes.map((code) => (
              <li key={code.code} className="py-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold">{code.code}</span>
                  <Badge tone={code.referOut ? "danger" : code.scope === "manufacturer" ? "warn" : "neutral"}>
                    {code.scope === "manufacturer" ? "Maker-specific" : "Standard"}
                  </Badge>
                </div>
                <p className="mt-1 text-sm">{code.plain}</p>
                <p className="mt-1 text-xs text-muted">{code.advice}</p>
              </li>
            ))}
          </ul>
          {codes.unrecognised.length > 0 ? (
            <p className="mt-2 text-xs text-muted">Not recognised as fault codes: {codes.unrecognised.join(", ")}</p>
          ) : null}
        </Card>
      ) : null}

      {result.causes.length === 0 ? (
        <Card>
          <p className="text-sm">Not enough to go on yet. Answer a few more questions, or describe the symptom differently.</p>
        </Card>
      ) : null}

      {result.causes.map((ranked, index) => {
        const job = ranked.cause.jobId ? getJob(ranked.cause.jobId) : null;
        return (
          <Card key={ranked.cause.id}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-muted">#{index + 1}</span>
              <Badge tone={CONFIDENCE_TONE[ranked.confidence]}>{ranked.confidence}</Badge>
              {job ? <Badge tone={TIER_TONE[job.tier]}>{job.tier}</Badge> : null}
              <span className="ml-auto text-sm font-semibold">
                £{ranked.cause.costGbp.min}–{ranked.cause.costGbp.max}
              </span>
            </div>
            <h3 className="mt-2 text-lg font-bold">{ranked.cause.name}</h3>
            <p className="mt-1 text-sm">{ranked.cause.what}</p>
            <p className="mt-2 text-sm text-muted">{ranked.cause.fits}</p>

            {ranked.motEvidence.length > 0 ? (
              <div className="mt-3 rounded-lg border border-accent/40 bg-accent/5 p-2">
                <p className="text-xs font-semibold text-accent">From your car&apos;s MOT record</p>
                {ranked.motEvidence.map((e) => (
                  <p key={e} className="text-xs">
                    {e}
                  </p>
                ))}
              </div>
            ) : null}

            {ranked.reasons.length > 0 ? (
              <ul className="mt-3 space-y-0.5 text-xs text-muted">
                {ranked.reasons.map((r) => (
                  <li key={r}>· {r}</li>
                ))}
              </ul>
            ) : null}

            {ranked.cause.ownCheck ? (
              <div className="mt-3 rounded-lg border border-ok/40 bg-ok/5 p-2 text-sm">
                <span className="font-semibold text-ok">Check it yourself: </span>
                {ranked.cause.ownCheck}
              </div>
            ) : null}

            {job ? (
              <Link href={`/garage/${vehicle.id}/jobs/${job.id}`} className="mt-3 inline-block text-sm font-semibold text-accent">
                {job.tier === "red" ? `Why ${job.title.toLowerCase()} goes to a garage →` : `Open the ${job.title.toLowerCase()} guide →`}
              </Link>
            ) : (
              <p className="mt-3 text-xs text-muted">No guide for this one; the cost above is for having it done.</p>
            )}
          </Card>
        );
      })}

      <Card>
        <p className="text-xs text-muted">
          Ranked from your answers{result.causes.some((c) => c.motEvidence.length > 0) ? ", your car's MOT record" : ""}
          {codes.codes.length > 0 ? " and your fault codes" : ""}. This is a starting point for your own checks, not an inspection. If
          the car feels unsafe, stop driving it.
        </p>
      </Card>

      <Button variant="secondary" onClick={restart}>
        Start again
      </Button>
    </div>
  );
}
