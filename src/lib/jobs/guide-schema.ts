/**
 * The shape of a generated guide. `ModelGuideOutputSchema` is what the model
 * must produce (handed to Ollama as JSON Schema); `GuideRecordSchema` wraps
 * it with provenance, review status and the spec-check result for storage.
 */
import { z } from "zod";
import { DIAGRAM_LABELS, diagramLabelKeys } from "./diagrams";
import type { JobDefinition } from "./types";

const FuelEnum = z.enum(["petrol", "diesel", "hybrid", "plug_in_hybrid", "electric", "other", "unknown"]);

export const GuideScopeSchema = z.object({
  makeRaw: z.string().min(1).describe("Make in upper case, exactly as the registration record has it, e.g. FORD"),
  modelRaw: z.string().min(1).describe("Model in upper case, e.g. FOCUS"),
  yearFrom: z.number().int().min(1950).max(2100).describe("First model year this guide applies to"),
  yearTo: z.number().int().min(1950).max(2100).describe("Last model year this guide applies to"),
  engineCc: z.number().int().nullable().describe("Engine capacity in cc this guide is written for, or null if it applies to all engines"),
  fuel: FuelEnum,
  variantNotes: z.string().nullable().describe("Which variants this covers and which it does not, e.g. not performance brakes"),
});

export const ToolItemSchema = z.object({
  name: z.string().min(1),
  why: z.string().nullable(),
  priceGbp: z.object({ min: z.number().min(0), max: z.number().min(0) }).nullable(),
});

export const GuideStepSchema = z.object({
  title: z.string().min(1),
  instruction: z.string().min(1),
  caution: z.string().nullable().describe("A specific danger at this step, or null"),
  checkpoint: z.string().nullable().describe("What must be true before moving on, or null"),
});

export const GuideFigureSchema = z.object({
  name: z.string().min(1).describe("e.g. Caliper guide-pin bolt torque"),
  unit: z.string().min(1).describe("e.g. Nm, mm, litres"),
  value: z.number().nullable().describe("MUST be null unless the exact figure was given to you in the grounding facts"),
  source: z.string().nullable().describe("Where the value came from, or null"),
  note: z.string().min(1).describe("Where the reader can find the figure themselves"),
});

/** Stored form: any diagram's labels. The per-job model schema is stricter. */
export const DiagramLabelsSchema = z.record(z.string(), z.string().nullable());

function diagramLabelsSchemaFor(job: JobDefinition) {
  if (!job.diagram) return z.object({});
  const shape: Record<string, z.ZodType> = {};
  for (const key of diagramLabelKeys(job.diagram)) {
    shape[key] = z.string().nullable().describe(`Label for: ${DIAGRAM_LABELS[job.diagram][key]}. Null to keep the default wording.`);
  }
  return z.object(shape);
}

export const GuideContentSchema = z.object({
  summary: z.string().min(1).describe("What the part does and what the job involves, for someone who has never done it"),
  partLocation: z.string().min(1).describe("Where the parts are, with spatial anchors, e.g. facing the hub from the side of the car"),
  difficulty: z.number().int().min(1).max(5),
  timeMinutes: z.object({ min: z.number().int().min(1), max: z.number().int().min(1) }),
  toolsExtra: z.array(ToolItemSchema).describe("Tools specific to this car beyond the standard list, e.g. an unusual bolt drive"),
  partsNeeded: z.array(z.object({ name: z.string().min(1), notes: z.string().nullable() })),
  steps: z.array(GuideStepSchema).min(4),
  figures: z.array(GuideFigureSchema).describe("Every torque, capacity or wear figure the job needs, listed by name with value null"),
  gotchas: z.array(z.string()).describe("Model-specific pitfalls"),
  verification: z.array(z.string()).min(1).describe("What done correctly looks like"),
  ifWrong: z.array(z.string()).min(1).describe("What to do if it does not look like that"),
  diagramLabels: DiagramLabelsSchema,
  videoQuery: z.string().min(1).describe("A YouTube search that would find this job on this car"),
  confidence: z.enum(["high", "medium", "low"]),
  notesForReviewer: z.string().describe("Anything the human reviewer should verify on the car before publishing"),
});

export const ModelGuideOutputSchema = z.object({
  scope: GuideScopeSchema,
  content: GuideContentSchema,
});

export type ModelGuideOutput = z.infer<typeof ModelGuideOutputSchema>;

/** What the model must produce for a given job: the diagram labels are exactly that job's diagram keys. */
export function modelOutputSchemaFor(job: JobDefinition) {
  return z.object({
    scope: GuideScopeSchema,
    content: GuideContentSchema.extend({ diagramLabels: diagramLabelsSchemaFor(job) }),
  });
}
export type GuideScope = z.infer<typeof GuideScopeSchema>;
export type GuideContent = z.infer<typeof GuideContentSchema>;

export const SpecViolationSchema = z.object({
  path: z.string(),
  kind: z.enum(["torque", "capacity", "pressure", "thickness", "part_number", "figure_value"]),
  text: z.string(),
});

export const GuideRecordSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().min(1),
  jobId: z.string().min(1),
  scope: GuideScopeSchema,
  content: GuideContentSchema,
  /** draft = generated, unreviewed; blocked = failed the spec check; reviewed = a person checked it. */
  status: z.enum(["draft", "blocked", "reviewed"]),
  specCheck: z.object({ ok: z.boolean(), violations: z.array(SpecViolationSchema) }),
  generatedBy: z.object({
    provider: z.string(),
    model: z.string(),
    durationMs: z.number().nullable(),
    promptTokens: z.number().nullable(),
    completionTokens: z.number().nullable(),
  }),
  /** The facts the model was given, verbatim. */
  grounding: z.array(z.string()),
  generatedAt: z.string(),
  reviewedAt: z.string().nullable(),
  reviewedBy: z.string().nullable(),
  version: z.number().int().min(1),
});

export type GuideRecord = z.infer<typeof GuideRecordSchema>;
export type SpecViolation = z.infer<typeof SpecViolationSchema>;

/** JSON Schema for the model. zod 4 emits draft 2020-12 with additionalProperties: false. */
export function modelOutputJsonSchema(job?: JobDefinition): Record<string, unknown> {
  return z.toJSONSchema(job ? modelOutputSchemaFor(job) : ModelGuideOutputSchema) as Record<string, unknown>;
}
