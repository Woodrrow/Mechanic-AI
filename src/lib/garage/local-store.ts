import type { Vehicle, VehicleCore } from "@/lib/vehicle/types";
import { newVehicleId, type GarageStore } from "./types";

const STORAGE_KEY = "pocket-mechanic.garage.v1";

export class LocalGarageStore implements GarageStore {
  readonly kind = "local" as const;

  private read(): Vehicle[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as Vehicle[]) : [];
    } catch {
      return [];
    }
  }

  private write(vehicles: Vehicle[]): void {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
  }

  async list(): Promise<Vehicle[]> {
    return this.read().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async get(id: string): Promise<Vehicle | null> {
    return this.read().find((v) => v.id === id) ?? null;
  }

  async add(core: VehicleCore): Promise<Vehicle> {
    const now = new Date().toISOString();
    const vehicle: Vehicle = { ...core, id: newVehicleId(), createdAt: now, updatedAt: now };
    this.write([...this.read(), vehicle]);
    return vehicle;
  }

  async update(id: string, patch: Partial<VehicleCore>): Promise<Vehicle> {
    const vehicles = this.read();
    const index = vehicles.findIndex((v) => v.id === id);
    if (index < 0) throw new Error("That car is no longer in your garage.");
    const updated: Vehicle = { ...vehicles[index], ...patch, id, updatedAt: new Date().toISOString() };
    vehicles[index] = updated;
    this.write(vehicles);
    return updated;
  }

  async remove(id: string): Promise<void> {
    this.write(this.read().filter((v) => v.id !== id));
  }
}
