"use client";

import { useGarage } from "@/lib/garage/use-garage";
import { ButtonLink, Card } from "./ui";
import { VehicleCard } from "./vehicle-card";

export function GarageList() {
  const { vehicles, loading, error, storeKind } = useGarage();

  if (loading) return <p className="text-muted">Opening your garage…</p>;

  if (error) {
    return (
      <Card>
        <p className="font-semibold text-danger">Could not open your garage</p>
        <p className="mt-1 text-sm text-muted">{error}</p>
      </Card>
    );
  }

  if (!vehicles || vehicles.length === 0) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold">My Garage</h1>
          <p className="mt-2 text-muted">
            Add your car once. Everything else in Pocket Mechanic is then filtered through its exact make, model,
            year, engine and fuel, so you never get advice for &quot;a Ford&quot; when you own a 2015 1.6 petrol Focus.
          </p>
        </div>
        <ButtonLink href="/garage/add">Add your car</ButtonLink>
        <p className="text-xs text-muted">
          You will need the registration plate. UK cars only for now; anywhere else, use the VIN.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-bold">My Garage</h1>
        <span className="text-sm text-muted">
          {vehicles.length} {vehicles.length === 1 ? "car" : "cars"}
        </span>
      </div>
      <ul className="space-y-3">
        {vehicles.map((v) => (
          <li key={v.id}>
            <VehicleCard vehicle={v} />
          </li>
        ))}
      </ul>
      <ButtonLink href="/garage/add" variant="secondary">
        Add another car
      </ButtonLink>
      {storeKind === "local" ? (
        <p className="text-xs text-muted">
          Saved on this device only. Configure Supabase to keep your garage across devices.
        </p>
      ) : null}
    </div>
  );
}
