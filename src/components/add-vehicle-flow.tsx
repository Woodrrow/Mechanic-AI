"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useGarage } from "@/lib/garage/use-garage";
import type { LookupOutcome } from "@/lib/vehicle/lookup";
import { lookupVehicle } from "@/lib/vehicle/lookup-client";
import type { VehicleCore } from "@/lib/vehicle/types";
import { CandidateReview } from "./candidate-review";
import { Disclaimer } from "./disclaimer";
import { Button, Card } from "./ui";

type Mode = "registration" | "vin";

type Step =
  | { name: "input" }
  | { name: "looking" }
  | { name: "review"; outcome: LookupOutcome }
  | { name: "saving"; outcome: LookupOutcome };

const INPUT_CLASS =
  "mt-1 w-full rounded-xl border border-border bg-background px-3 py-3 font-mono text-lg uppercase tracking-widest outline-none focus:border-accent";

export function AddVehicleFlow({
  demo,
  demoRegistrations,
  demoVins,
}: {
  demo: boolean;
  demoRegistrations: string[];
  demoVins: string[];
}) {
  const router = useRouter();
  const { add } = useGarage();
  const [mode, setMode] = useState<Mode>("registration");
  const [value, setValue] = useState("");
  const [step, setStep] = useState<Step>({ name: "input" });
  const [error, setError] = useState<string | null>(null);

  async function lookup(raw: string) {
    setError(null);
    setStep({ name: "looking" });
    const response = await lookupVehicle(mode === "registration" ? { registration: raw } : { vin: raw });
    if (!response.ok) {
      setError(response.error.message);
      setStep({ name: "input" });
      return;
    }
    setStep({ name: "review", outcome: response });
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (value.trim()) void lookup(value);
  }

  async function onSave(core: VehicleCore) {
    if (step.name !== "review") return;
    const { outcome } = step;
    setStep({ name: "saving", outcome });
    try {
      const saved = await add(core);
      router.push(`/garage/${saved.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the vehicle.");
      setStep({ name: "review", outcome });
    }
  }

  if (step.name === "review" || step.name === "saving") {
    return (
      <CandidateReview
        outcome={step.outcome}
        saving={step.name === "saving"}
        error={error}
        onSave={onSave}
        onBack={() => {
          setError(null);
          setStep({ name: "input" });
        }}
      />
    );
  }

  const looking = step.name === "looking";
  const examples = mode === "registration" ? demoRegistrations : demoVins;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Add your car</h1>
        <p className="mt-1 text-muted">
          UK cars: type the registration and we will fetch the official record. Anywhere else, use the VIN from the
          windscreen or door pillar.
        </p>
      </div>

      <div role="tablist" aria-label="Lookup method" className="grid grid-cols-2 rounded-xl border border-border bg-card p-1 text-sm">
        {(
          [
            ["registration", "UK registration"],
            ["vin", "VIN"],
          ] as const
        ).map(([m, label]) => (
          <button
            key={m}
            role="tab"
            type="button"
            aria-selected={mode === m}
            onClick={() => {
              if (m === mode) return;
              setMode(m);
              setValue("");
              setError(null);
            }}
            className={`rounded-lg px-3 py-2 font-semibold transition ${
              mode === m ? "bg-accent text-accent-foreground" : "text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block">
          <span className="text-sm font-medium">{mode === "registration" ? "Registration" : "VIN"}</span>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={mode === "registration" ? "AB12 CDE" : "17 characters"}
            autoCapitalize="characters"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            maxLength={mode === "registration" ? 10 : 20}
            className={INPUT_CLASS}
            aria-invalid={error ? true : undefined}
          />
          <span className="mt-1 block text-xs text-muted">
            {mode === "registration"
              ? "Spaces do not matter. Looked up once, never shown to anyone else."
              : "17 letters and digits; it never contains I, O or Q."}
          </span>
        </label>
        <Button type="submit" disabled={looking || !value.trim()}>
          {looking ? "Looking up…" : "Look up"}
        </Button>
        {error ? (
          <p role="alert" className="text-sm font-medium text-danger">
            {error}
          </p>
        ) : null}
      </form>

      {demo ? (
        <Card>
          <p className="text-sm font-semibold">Demo mode</p>
          <p className="mt-1 text-sm text-muted">
            No DVLA or DVSA keys are configured, so lookups use bundled sample vehicles. Try one:
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {examples.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => {
                  setValue(ex);
                  void lookup(ex);
                }}
                disabled={looking}
                className="rounded-lg border border-border px-2.5 py-1.5 font-mono text-sm hover:border-accent"
              >
                {ex}
              </button>
            ))}
          </div>
        </Card>
      ) : null}

      <Disclaimer />
    </div>
  );
}
