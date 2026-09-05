import type { JobTier } from "@/lib/mot/types";

export type JobId = "front-brake-pads";

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

export interface JobDefinition {
  id: JobId;
  title: string;
  system: "brakes";
  tier: JobTier;
  /** One line for lists and cards. */
  blurb: string;
  baseTools: ToolItem[];
  consumables: ToolItem[];
  safety: JobSafety;
  diagram: "disc-brake-corner";
  /** MOT rule ids that make this job relevant to a car. */
  motRuleIds: string[];
  typicalTimeMinutes: { min: number; max: number };
}
