"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useVehicle } from "@/lib/garage/use-garage";
import { engineLitres, FUEL_LABEL, SOURCE_DESCRIPTION, TRANSMISSION_LABEL, vehicleTitle } from "@/lib/vehicle/format";
import { formatRegistration } from "@/lib/vehicle/registration";
import type { Source, Vehicle } from "@/lib/vehicle/types";
import { FieldSource } from "./source-badge";
import { Button, Card, Plate } from "./ui";

function Row({ label, value, children }: { label: string; value: string | null | undefined; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="flex items-center gap-2 text-right text-sm font-medium">
        <span className={value ? "" : "text-warn"}>{value ?? "Unknown"}</span>
        {children}
      </dd>
    </div>
  );
}

const RAW_SOURCES: Array<{ key: keyof Vehicle["sources"]; source: Source }> = [
  { key: "dvlaVes", source: "dvla_ves" },
  { key: "dvsaMot", source: "dvsa_mot" },
  { key: "nhtsaVpic", source: "nhtsa_vpic" },
];

export function VehicleDetail({ id }: { id: string }) {
  const router = useRouter();
  const { vehicle, loading, error, remove } = useVehicle(id);
  const [removing, setRemoving] = useState(false);

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

  const fixture = Boolean(vehicle.sources.fixture);
  const litres = engineLitres(vehicle.engineCc);
  const uk = vehicle.uk;

  async function onRemove() {
    if (!window.confirm("Remove this car from your garage?")) return;
    setRemoving(true);
    try {
      await remove();
      router.push("/");
    } catch (e) {
      setRemoving(false);
      window.alert(e instanceof Error ? e.message : "Could not remove the vehicle.");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{vehicleTitle(vehicle) || "Unknown vehicle"}</h1>
          <p className="text-sm text-muted">
            {[litres ? `${litres}L` : null, vehicle.fuel !== "unknown" ? FUEL_LABEL[vehicle.fuel] : null, vehicle.colour]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        {vehicle.registration ? <Plate value={formatRegistration(vehicle.registration)} /> : null}
      </div>

      <Card>
        <h2 className="font-semibold">Vehicle</h2>
        <dl className="mt-2 divide-y divide-border">
          <Row label="Make" value={vehicle.make}>
            <FieldSource field="make" provenance={vehicle.provenance} fixture={fixture} />
          </Row>
          <Row label="Model" value={vehicle.model}>
            <FieldSource field="model" provenance={vehicle.provenance} fixture={fixture} />
          </Row>
          <Row label="Year" value={vehicle.year ? String(vehicle.year) : null}>
            <FieldSource field="year" provenance={vehicle.provenance} fixture={fixture} />
          </Row>
          <Row label="Engine" value={vehicle.engineCc ? `${litres}L (${vehicle.engineCc} cc)` : null}>
            <FieldSource field="engineCc" provenance={vehicle.provenance} fixture={fixture} />
          </Row>
          <Row label="Fuel" value={vehicle.fuel === "unknown" ? null : FUEL_LABEL[vehicle.fuel]}>
            <FieldSource field="fuel" provenance={vehicle.provenance} fixture={fixture} />
          </Row>
          <Row label="Gearbox" value={vehicle.transmission === "unknown" ? null : TRANSMISSION_LABEL[vehicle.transmission]}>
            <FieldSource field="transmission" provenance={vehicle.provenance} fixture={fixture} />
          </Row>
          <Row label="Colour" value={vehicle.colour}>
            <FieldSource field="colour" provenance={vehicle.provenance} fixture={fixture} />
          </Row>
          {vehicle.vin ? <Row label="VIN" value={vehicle.vin} /> : null}
        </dl>
        {vehicle.provenance.some((p) => p.note) ? (
          <ul className="mt-3 space-y-1 text-xs text-muted">
            {vehicle.provenance
              .filter((p) => p.note)
              .map((p) => (
                <li key={`${p.field}-${p.source}`}>* {p.field}: {p.note}</li>
              ))}
          </ul>
        ) : null}
      </Card>

      {uk ? (
        <Card>
          <h2 className="font-semibold">UK record</h2>
          <dl className="mt-2 divide-y divide-border">
            {uk.taxStatus ? <Row label="Tax" value={uk.taxDueDate ? `${uk.taxStatus} · due ${uk.taxDueDate}` : uk.taxStatus} /> : null}
            {uk.motStatus ? <Row label="MOT" value={uk.motExpiryDate ? `${uk.motStatus} · expires ${uk.motExpiryDate}` : uk.motStatus} /> : null}
            {uk.motTestDueDate ? <Row label="First MOT due" value={uk.motTestDueDate} /> : null}
            {uk.firstRegistered ? <Row label="First registered" value={uk.firstRegistered} /> : null}
            {uk.euroStatus ? <Row label="Euro status" value={uk.euroStatus} /> : null}
            {uk.co2GPerKm !== undefined ? <Row label="CO₂" value={`${uk.co2GPerKm} g/km`} /> : null}
            {uk.hasOutstandingRecall ? <Row label="Outstanding recall" value={uk.hasOutstandingRecall} /> : null}
            {uk.motTestCount !== undefined ? <Row label="MOT tests on record" value={String(uk.motTestCount)} /> : null}
          </dl>
          {uk.motTestCount ? (
            <p className="mt-3 rounded-lg border border-accent/30 bg-accent/5 p-3 text-xs">
              Your MOT history is saved with this car. The plain-English view of its advisories, and what has
              probably worsened since, is Phase 2.
            </p>
          ) : null}
        </Card>
      ) : null}

      <details className="rounded-2xl border border-border bg-card p-4">
        <summary className="cursor-pointer text-sm font-semibold">What each source returned</summary>
        <div className="mt-3 space-y-3">
          {RAW_SOURCES.filter(({ key }) => vehicle.sources[key] !== undefined).map(({ key, source }) => (
            <div key={key}>
              <p className="text-xs font-semibold text-muted">{SOURCE_DESCRIPTION[source]}</p>
              <pre className="mt-1 max-h-72 overflow-auto rounded-lg bg-background p-2 text-[11px] leading-snug">
                {JSON.stringify(vehicle.sources[key], null, 2)}
              </pre>
            </div>
          ))}
          {fixture ? <p className="text-xs text-muted">These payloads are demo fixtures, not live API responses.</p> : null}
        </div>
      </details>

      <Button variant="danger" onClick={onRemove} disabled={removing}>
        {removing ? "Removing…" : "Remove from garage"}
      </Button>
    </div>
  );
}
