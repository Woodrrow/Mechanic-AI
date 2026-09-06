import type { JobTier } from "@/lib/mot/types";
import type { FuelType } from "@/lib/vehicle/types";

export type JobSystem =
  | "brakes"
  | "suspension_steering"
  | "engine_service"
  | "electrical"
  | "body_visibility"
  | "safety_systems";

export const SYSTEM_LABEL: Record<JobSystem, string> = {
  brakes: "Brakes",
  suspension_steering: "Suspension & steering",
  engine_service: "Engine & servicing",
  electrical: "Electrical & lights",
  body_visibility: "Body, exhaust & visibility",
  safety_systems: "Leave to a professional",
};

export type DiagramId = "disc-brake-corner" | "engine-bay" | "battery-terminals" | "suspension-strut" | "serpentine-belt";

export interface ToolItem {
  name: string;
  why?: string;
  /** Indicative UK retail range, not a quote. */
  priceGbp?: { min: number; max: number };
  optional?: boolean;
}

export interface JobSafety {
  dangers: string[];
  requirements: string[];
  acknowledgement: string;
}

/** RED jobs: what is shown instead of a guide. */
export interface JobRefusal {
  why: string[];
  professional: { priceGbp: { min: number; max: number }; note: string };
  whatYouCanDo: string[];
}

export interface JobDefinition {
  id: string;
  title: string;
  system: JobSystem;
  tier: JobTier;
  /** One line for lists and cards. */
  blurb: string;
  baseTools: ToolItem[];
  consumables: ToolItem[];
  safety: JobSafety;
  diagram: DiagramId | null;
  /** MOT rule ids that make this job relevant to a car. */
  motRuleIds: string[];
  typicalTimeMinutes: { min: number; max: number };
  /** The procedure depends on the engine: a platform sibling must share engine size and fuel. */
  engineSensitive: boolean;
  /** Fuel types the job applies to. Undefined means all. */
  fuels?: FuelType[];
  /** Extra instructions for the generator, specific to this job. */
  promptNotes?: string[];
  refusal?: JobRefusal;
}

export type JobId = string;
