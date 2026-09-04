import type { Vehicle, VehicleCore } from "@/lib/vehicle/types";

export type GarageStoreKind = "local" | "supabase";

/**
 * Where the user's vehicles live. Phase 1 ships two implementations behind
 * this interface: this device's localStorage (zero config) and Supabase
 * Postgres with anonymous auth + row-level security (when configured).
 */
export interface GarageStore {
  readonly kind: GarageStoreKind;
  list(): Promise<Vehicle[]>;
  get(id: string): Promise<Vehicle | null>;
  add(vehicle: VehicleCore): Promise<Vehicle>;
  remove(id: string): Promise<void>;
}

export function newVehicleId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  // Non-secure contexts (plain http on a LAN IP) lack randomUUID.
  return `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
