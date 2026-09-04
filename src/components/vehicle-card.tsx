import Link from "next/link";
import { engineSummary, vehicleTitle } from "@/lib/vehicle/format";
import { formatRegistration } from "@/lib/vehicle/registration";
import type { Vehicle } from "@/lib/vehicle/types";
import { Badge, Plate } from "./ui";

function motTone(status: string | undefined): "ok" | "warn" | "neutral" {
  if (!status) return "neutral";
  const s = status.toLowerCase();
  if (s.includes("valid")) return "ok";
  if (s.includes("not valid") || s.includes("expired")) return "warn";
  return "neutral";
}

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const title = vehicleTitle(vehicle) || "Unknown vehicle";
  const engine = engineSummary(vehicle);
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
        {vehicle.uk?.motStatus ? <Badge tone={motTone(vehicle.uk.motStatus)}>MOT {vehicle.uk.motStatus}</Badge> : null}
        {vehicle.uk?.taxStatus ? <Badge tone={motTone(vehicle.uk.taxStatus)}>{vehicle.uk.taxStatus}</Badge> : null}
        {vehicle.sources.fixture ? <Badge tone="accent">Demo data</Badge> : null}
        {vehicle.transmission === "unknown" ? <Badge tone="warn">Gearbox unconfirmed</Badge> : null}
      </div>
    </Link>
  );
}
