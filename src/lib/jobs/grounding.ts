/**
 * The verified facts handed to the model, and nothing else. Deliberately
 * excludes the owner's MOT advisories: the guide is cached per car model and
 * shared, so anything about one owner's car is layered on at render time.
 */
import { engineLitres } from "@/lib/vehicle/format";
import type { VehicleCore } from "@/lib/vehicle/types";
import type { GroundedFigure } from "./spec-check";
import type { JobDefinition } from "./types";

export interface Grounding {
  facts: string[];
  allowedNumbers: string[];
  groundedFigures: GroundedFigure[];
}

export function buildGrounding(vehicle: VehicleCore, job: JobDefinition): Grounding {
  const facts: string[] = [];
  const numbers = new Set<string>();

  facts.push(`Make: ${vehicle.makeRaw}`);
  if (vehicle.model) facts.push(`Model: ${vehicle.model.toUpperCase()}`);
  if (vehicle.year) {
    facts.push(`Year of manufacture: ${vehicle.year}`);
    numbers.add(String(vehicle.year));
  }
  if (vehicle.engineCc) {
    const litres = engineLitres(vehicle.engineCc);
    facts.push(`Engine capacity: ${vehicle.engineCc} cc${litres ? ` (${litres} litre)` : ""}`);
    numbers.add(String(vehicle.engineCc));
    if (litres) numbers.add(String(Number(litres)));
  }
  facts.push(`Fuel: ${vehicle.fuel}`);
  if (vehicle.transmission !== "unknown") facts.push(`Gearbox: ${vehicle.transmission}`);
  facts.push(`Job: ${job.title} (${job.id}), safety tier ${job.tier.toUpperCase()}`);
  facts.push("Torque figures, fluid capacities and part numbers available: none. Every figure must be listed with value null.");

  return { facts, allowedNumbers: [...numbers], groundedFigures: [] };
}
