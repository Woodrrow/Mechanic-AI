import Link from "next/link";
import { engineSummary, motSummary, taxTone, vehicleTitle } from "@/lib/vehicle/format";
import { formatRegistration } from "@/lib/vehicle/registration";
import type { Vehicle } from "@/lib/vehicle/types";
import { Badge, Plate } from "./ui";

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const title = vehicleTitle(vehicle) || "Unknown vehicle";
  const engine = engineSummary(vehicle);
  const mot = motSummary(vehicle.uk);
  return (
    <Link
      href={`/garage/${vehicle.id}`}
      className="block rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-muted"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{title}</p>
          <p className="text-sm text-muted">
            {[engine, vehicle.colour].filter(Boolean).join(" · ") || "Details to confirm"}
          </p>
        </div>
        {vehicle.registration ? <Plate value={formatRegistration(vehicle.registration)} /> : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {mot ? <Badge tone={mot.tone}>{mot.short}</Badge> : null}
        {vehicle.uk?.taxStatus ? <Badge tone={taxTone(vehicle.uk.taxStatus)}>Tax {vehicle.uk.taxStatus}</Badge> : null}
        {vehicle.sources.fixture ? <Badge tone="accent">Demo data</Badge> : null}
        {vehicle.transmission === "unknown" ? <Badge tone="warn">Gearbox unconfirmed</Badge> : null}
      </div>
    </Link>
  );
}
