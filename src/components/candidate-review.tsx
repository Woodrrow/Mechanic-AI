"use client";

import { useState } from "react";
import { engineLitres, FUEL_LABEL } from "@/lib/vehicle/format";
import type { LookupOutcome } from "@/lib/vehicle/lookup";
import { titleCase } from "@/lib/vehicle/normalise";
import { formatRegistration } from "@/lib/vehicle/registration";
import type { Provenance, Transmission, VehicleCandidate, VehicleCore } from "@/lib/vehicle/types";
import { ProviderStatusLine } from "./provider-status";
import { FieldSource } from "./source-badge";
import { Button, Card, Plate } from "./ui";

function toVehicleCore(c: VehicleCandidate): VehicleCore {
  return {
    country: c.country,
    registration: c.registration,
    vin: c.vin,
    make: c.make,
    makeRaw: c.makeRaw,
    model: c.model,
    year: c.year,
    engineCc: c.engineCc,
    fuel: c.fuel,
    transmission: c.transmission,
    colour: c.colour,
    uk: c.uk,
    provenance: c.provenance,
    sources: c.sources,
  };
}

const TRANSMISSION_OPTIONS: Array<{ value: Transmission; label: string; hint: string }> = [
  { value: "manual", label: "Manual", hint: "Clutch pedal, gear stick you move yourself" },
  { value: "automatic", label: "Automatic", hint: "Two pedals, P-R-N-D selector" },
  { value: "unknown", label: "Not sure", hint: "You can set this later" },
];

export function CandidateReview({
  outcome,
  saving,
  error,
  onSave,
  onBack,
}: {
  outcome: LookupOutcome;
  saving: boolean;
  error: string | null;
  onSave: (vehicle: VehicleCore) => void;
  onBack: () => void;
}) {
  const { candidate, providers, demo } = outcome;
  const fixture = Boolean(candidate.sources.fixture);
  const needsModel = candidate.needsConfirmation.includes("model");
  const needsYear = candidate.needsConfirmation.includes("year");
  const needsTransmission = candidate.needsConfirmation.includes("transmission");

  const [transmission, setTransmission] = useState<Transmission>(candidate.transmission);
  const [model, setModel] = useState(candidate.model ?? "");
  const [year, setYear] = useState(candidate.year ? String(candidate.year) : "");

  const modelValue = model.trim() ? titleCase(model.trim()) : null;
  const yearNumber = Number.parseInt(year, 10);
  const yearValue = Number.isInteger(yearNumber) && yearNumber >= 1900 && yearNumber <= 2100 ? yearNumber : null;
  const canSave = !saving && (!needsModel || modelValue !== null) && (!needsYear || yearValue !== null);

  function handleSave() {
    const core = toVehicleCore(candidate);
    const provenance: Provenance[] = [...candidate.provenance];
    if (modelValue && modelValue !== candidate.model) {
      core.model = modelValue;
      provenance.push({ field: "model", source: "user", raw: model.trim() });
    }
    if (yearValue && yearValue !== candidate.year) {
      core.year = yearValue;
      provenance.push({ field: "year", source: "user", raw: yearValue });
    }
    if (transmission !== candidate.transmission) {
      core.transmission = transmission;
      provenance.push({ field: "transmission", source: "user", raw: transmission });
    }
    core.provenance = provenance;
    onSave(core);
  }

  const litres = engineLitres(candidate.engineCc);
  const headline = [yearValue ?? candidate.year, candidate.make, modelValue ?? candidate.model].filter(Boolean).join(" ");

  const rows: Array<{ label: string; value: string | null; field: string }> = [
    { label: "Make", value: candidate.make, field: "make" },
    { label: "Model", value: candidate.model, field: "model" },
    { label: "Year", value: candidate.year ? String(candidate.year) : null, field: "year" },
    {
      label: "Engine",
      value: candidate.engineCc ? `${litres}L (${candidate.engineCc} cc)` : null,
      field: "engineCc",
    },
    { label: "Fuel", value: candidate.fuel === "unknown" ? null : FUEL_LABEL[candidate.fuel], field: "fuel" },
    { label: "Colour", value: candidate.colour, field: "colour" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Is this your car?</h1>
        <p className="mt-1 text-sm text-muted">Check the details before saving. Each one shows where it came from.</p>
      </div>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <p className="text-xl font-semibold">{headline || "Unknown vehicle"}</p>
          {candidate.registration ? <Plate value={formatRegistration(candidate.registration)} /> : null}
        </div>
        {candidate.vin ? <p className="mt-1 font-mono text-xs text-muted">VIN {candidate.vin}</p> : null}
        <dl className="mt-4 divide-y divide-border">
          {rows.map((row) => (
            <div key={row.field} className="flex items-center justify-between gap-3 py-2">
              <dt className="text-sm text-muted">{row.label}</dt>
              <dd className="flex items-center gap-2 text-right text-sm font-medium">
                <span className={row.value ? "" : "text-warn"}>{row.value ?? "Unknown"}</span>
                <FieldSource field={row.field} provenance={candidate.provenance} fixture={fixture} />
              </dd>
            </div>
          ))}
        </dl>
        {candidate.uk?.motStatus || candidate.uk?.taxStatus ? (
          <p className="mt-3 text-xs text-muted">
            {[
              candidate.uk.motStatus ? `MOT: ${candidate.uk.motStatus}` : null,
              candidate.uk.motExpiryDate ? `expires ${candidate.uk.motExpiryDate}` : null,
              candidate.uk.motTestDueDate ? `first MOT due ${candidate.uk.motTestDueDate}` : null,
              candidate.uk.taxStatus ? `Tax: ${candidate.uk.taxStatus}` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        ) : null}
      </Card>

      <Card>
        <h2 className="font-semibold">Tell us what the records can&apos;t</h2>
        <p className="mt-1 text-sm text-muted">
          The free government records stop short of a few details we need to give you the right guide.
        </p>

        {needsModel ? (
          <label className="mt-4 block">
            <span className="text-sm font-medium">Model</span>
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g. Focus"
              autoComplete="off"
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-3 text-base outline-none focus:border-accent"
            />
            <span className="mt-1 block text-xs text-muted">It is on the V5C logbook and usually on the tailgate.</span>
          </label>
        ) : null}

        {needsYear ? (
          <label className="mt-4 block">
            <span className="text-sm font-medium">Year of manufacture</span>
            <input
              value={year}
              onChange={(e) => setYear(e.target.value)}
              inputMode="numeric"
              placeholder="e.g. 2015"
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-3 text-base outline-none focus:border-accent"
            />
          </label>
        ) : null}

        {needsTransmission ? (
          <fieldset className="mt-4">
            <legend className="text-sm font-medium">Gearbox</legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {TRANSMISSION_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`cursor-pointer rounded-xl border p-3 text-center text-sm ${
                    transmission === opt.value ? "border-accent bg-accent/10 font-semibold" : "border-border"
                  }`}
                >
                  <input
                    type="radio"
                    name="transmission"
                    value={opt.value}
                    checked={transmission === opt.value}
                    onChange={() => setTransmission(opt.value)}
                    className="sr-only"
                  />
                  {opt.label}
                  <span className="mt-1 block text-[11px] font-normal text-muted">{opt.hint}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}
      </Card>

      {candidate.warnings.length > 0 ? (
        <div className="rounded-xl border border-warn/40 bg-warn-bg p-4 text-sm">
          <p className="font-semibold text-warn">Things to know</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {candidate.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="space-y-2">
        <ProviderStatusLine providers={providers} />
        {demo ? (
          <p className="text-xs text-muted">
            Demo mode: these details come from bundled sample data, not the live DVLA and DVSA services.
          </p>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}

      <div className="space-y-2">
        <Button onClick={handleSave} disabled={!canSave}>
          {saving ? "Saving…" : "Save to My Garage"}
        </Button>
        <Button variant="secondary" onClick={onBack} disabled={saving}>
          Not my car
        </Button>
      </div>
    </div>
  );
}
