/**
 * One generation: grounding -> prompt -> model -> validate -> spec check -> record.
 * Used by scripts/generate-guide.mts. Never called from the deployed app.
 */
import type { StructuredModel } from "@/lib/llm/types";
import type { VehicleCore } from "@/lib/vehicle/types";
import { buildGrounding } from "./grounding";
import { ModelGuideOutputSchema, modelOutputJsonSchema, type GuideRecord } from "./guide-schema";
import { guideFileName } from "./match";
import { buildUserPrompt, SYSTEM_PROMPT } from "./prompt";
import { checkGuide } from "./spec-check";
import type { JobDefinition } from "./types";

export interface GenerateOptions {
  now?: Date;
  version?: number;
}

export async function generateGuide(
  vehicle: VehicleCore,
  job: JobDefinition,
  model: StructuredModel,
  opts: GenerateOptions = {},
): Promise<{ record: GuideRecord; fileName: string }> {
  const grounding = buildGrounding(vehicle, job);
  const result = await model.generate({
    system: SYSTEM_PROMPT,
    prompt: buildUserPrompt(job, grounding),
    schema: ModelGuideOutputSchema,
    jsonSchema: modelOutputJsonSchema(),
  });
  const output = result.value;
  const specCheck = checkGuide(output, { allowedNumbers: grounding.allowedNumbers, groundedFigures: grounding.groundedFigures });
  const now = opts.now ?? new Date();
  const record: GuideRecord = {
    schemaVersion: 1,
    id: guideFileName({ jobId: job.id, scope: output.scope }).replace(/\.json$/, ""),
    jobId: job.id,
    scope: { ...output.scope, makeRaw: output.scope.makeRaw.toUpperCase(), modelRaw: output.scope.modelRaw.toUpperCase() },
    content: output.content,
    status: specCheck.ok ? "draft" : "blocked",
    specCheck,
    generatedBy: {
      provider: model.provider,
      model: model.model,
      durationMs: result.usage.durationMs,
      promptTokens: result.usage.promptTokens ?? null,
      completionTokens: result.usage.completionTokens ?? null,
    },
    grounding: grounding.facts,
    generatedAt: now.toISOString(),
    reviewedAt: null,
    reviewedBy: null,
    version: opts.version ?? 1,
  };
  return { record, fileName: guideFileName(record) };
}
