import type { JobTier } from "@/lib/mot/types";

export type SymptomId = string;
export type CauseId = string;

export type SymptomCategory = "braking" | "handling" | "starting" | "running" | "noises" | "warning_lights" | "fluids_smells";

export const CATEGORY_LABEL: Record<SymptomCategory, string> = {
  braking: "Braking",
  handling: "Steering & handling",
  starting: "Starting",
  running: "Running & power",
  noises: "Noises & vibration",
  warning_lights: "Warning lights",
  fluids_smells: "Leaks & smells",
};

export interface AnswerOption {
  id: string;
  label: string;
  hint?: string;
}

export interface Question {
  id: string;
  ask: string;
  /** Why we are asking, shown small. Keeps the interview honest. */
  why?: string;
  options: AnswerOption[];
  multi?: boolean;
}

/** How an answer moves a cause's likelihood. */
export type Effect = Record<CauseId, number>;

export interface SymptomDefinition {
  id: SymptomId;
  category: SymptomCategory;
  /** What the user would say. */
  label: string;
  /** Other phrasings, for search. */
  aliases: string[];
  /** Shown under the label. */
  blurb: string;
  /** Stop the interview and say this instead. */
  safetyStop?: { title: string; body: string[] };
  questions: Question[];
  /** answer id -> effects on causes */
  effects: Record<string, Effect>;
  /** Base likelihood before any answers. */
  priors: Effect;
}

export interface CauseDefinition {
  id: CauseId;
  name: string;
  /** What it is, for someone who does not know the part. */
  what: string;
  /** How it feels or sounds when this is the cause. */
  fits: string;
  /** Cost of having it done professionally, indicative UK range. */
  costGbp: { min: number; max: number };
  /** The catalogue job, if there is one. */
  jobId?: string;
  /** When there is no job: where it goes. */
  tier: JobTier;
  /** MOT rule ids that corroborate this cause. */
  motRuleIds?: string[];
  /** A check the user can do themselves before spending anything. */
  ownCheck?: string;
}

export type Confidence = "likely" | "possible" | "less likely";

export interface RankedCause {
  cause: CauseDefinition;
  score: number;
  confidence: Confidence;
  /** Plain-English reasons this is ranked where it is. */
  reasons: string[];
  /** MOT items from this car that support it. */
  motEvidence: string[];
}

export interface DiagnosisResult {
  symptom: SymptomDefinition;
  answered: number;
  totalQuestions: number;
  causes: RankedCause[];
  /** Set when the symptom is one we stop on for safety. */
  safetyStop?: SymptomDefinition["safetyStop"];
}
