"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { FUEL_LABEL } from "@/lib/vehicle/format";
import { COMMON_UK_MAKES } from "@/lib/vehicle/makes";
import {
  EMPTY_MANUAL_ENTRY,
  vehicleFromManualEntry,
  type ManualEntryErrors,
  type ManualEntryInput,
} from "@/lib/vehicle/manual";
import type { FuelType, Transmission, VehicleCore } from "@/lib/vehicle/types";
import { Button, Card } from "./ui";

const FUEL_OPTIONS: FuelType[] = ["petrol", "diesel", "hybrid", "plug_in_hybrid", "electric", "other"];

const TRANSMISSION_OPTIONS: Array<{ value: Transmission; label: string }> = [
  { value: "manual", label: "Manual" },
  { value: "automatic", label: "Automatic" },
  { value: "unknown", label: "Not sure" },
];

const INPUT = "mt-1 w-full rounded-xl border border-border bg-background px-3 py-3 text-base outline-none focus:border-accent";
const INPUT_ERROR = "border-danger";

function Field({
  label,
  code,
  hint,
  error,
  optional,
  children,
}: {
  label: string;
  code?: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">
        {label}
        {code ? <span className="ml-1 font-mono text-xs text-muted">{code}</span> : null}
        {optional ? <span className="font-normal text-muted"> · optional</span> : null}
      </span>
      {children}
      {error ? (
        <span role="alert" className="mt-1 block text-xs font-medium text-danger">
          {error}
        </span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-muted">{hint}</span>
      ) : null}
    </label>
  );
}

export function ManualEntryForm({
  onSave,
  saving,
  error,
}: {
  onSave: (vehicle: VehicleCore) => void;
  saving: boolean;
  error: string | null;
}) {
  const [input, setInput] = useState<ManualEntryInput>(EMPTY_MANUAL_ENTRY);
  const [errors, setErrors] = useState<ManualEntryErrors>({});

  function update<K extends keyof ManualEntryInput>(key: K, value: ManualEntryInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const result = vehicleFromManualEntry(input);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    onSave(result.vehicle);
  }

  const cls = (key: keyof ManualEntryErrors, extra = "") => `${INPUT} ${errors[key] ? INPUT_ERROR : ""} ${extra}`;

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Card>
        <p className="text-sm font-semibold">Copy it from the V5C logbook</p>
        <p className="mt-1 text-sm text-muted">
          Every field below is printed on the V5C. The grey codes are the labels on the form itself, so you can find
          each one quickly.
        </p>
      </Card>

      <Field label="Make" code="D.1" error={errors.make}>
        <input
          list="pocket-mechanic-makes"
          value={input.make}
          onChange={(e) => update("make", e.target.value)}
          placeholder="e.g. Ford"
          autoComplete="off"
          className={cls("make")}
        />
        <datalist id="pocket-mechanic-makes">
          {COMMON_UK_MAKES.map((make) => (
            <option key={make} value={make} />
          ))}
        </datalist>
      </Field>

      <Field label="Model" code="D.3" error={errors.model} hint="As written on the V5C, e.g. Focus, Golf, Qashqai">
        <input
          value={input.model}
          onChange={(e) => update("model", e.target.value)}
          placeholder="e.g. Focus"
          autoComplete="off"
          className={cls("model")}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Year" code="B" error={errors.year} hint="Manufacture year, or first registration if unsure">
          <input
            value={input.year}
            onChange={(e) => update("year", e.target.value)}
            inputMode="numeric"
            maxLength={4}
            placeholder="2015"
            className={cls("year")}
          />
        </Field>
        <Field label="Engine size" code="P.1" error={errors.engine} hint="In cc or litres. Blank if unsure">
          <input
            value={input.engine}
            onChange={(e) => update("engine", e.target.value)}
            inputMode="decimal"
            placeholder="1596 or 1.6"
            className={cls("engine")}
          />
        </Field>
      </div>

      <Field label="Fuel" code="P.3" error={errors.fuel}>
        <select
          value={input.fuel}
          onChange={(e) => update("fuel", e.target.value as FuelType | "")}
          className={cls("fuel", "appearance-none")}
        >
          <option value="">Choose…</option>
          {FUEL_OPTIONS.map((fuel) => (
            <option key={fuel} value={fuel}>
              {FUEL_LABEL[fuel]}
            </option>
          ))}
        </select>
      </Field>

      <fieldset>
        <legend className="text-sm font-medium">Gearbox</legend>
        <div className="mt-1 grid grid-cols-3 gap-2">
          {TRANSMISSION_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`cursor-pointer rounded-xl border p-3 text-center text-sm ${
                input.transmission === opt.value ? "border-accent bg-accent/10 font-semibold" : "border-border"
              }`}
            >
              <input
                type="radio"
                name="manual-transmission"
                value={opt.value}
                checked={input.transmission === opt.value}
                onChange={() => update("transmission", opt.value)}
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>

      <Field label="Colour" code="R" optional>
        <input
          value={input.colour}
          onChange={(e) => update("colour", e.target.value)}
          placeholder="e.g. Blue"
          autoComplete="off"
          className={cls("colour")}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Registration" optional error={errors.registration}>
          <input
            value={input.registration}
            onChange={(e) => update("registration", e.target.value)}
            placeholder="AB12 CDE"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            className={cls("registration", "font-mono uppercase tracking-wider")}
          />
        </Field>
        <Field label="VIN" code="E" optional error={errors.vin}>
          <input
            value={input.vin}
            onChange={(e) => update("vin", e.target.value)}
            placeholder="17 characters"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            className={cls("vin", "font-mono uppercase")}
          />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={!input.ukRegistered}
          onChange={(e) => update("ukRegistered", !e.target.checked)}
          className="h-4 w-4"
        />
        This car is not registered in the UK
      </label>

      {error ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save to My Garage"}
      </Button>
    </form>
  );
}
