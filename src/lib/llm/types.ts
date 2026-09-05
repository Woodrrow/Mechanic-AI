import type { z } from "zod";

export interface StructuredRequest<T> {
  system: string;
  prompt: string;
  /** Zod schema the output must satisfy. */
  schema: z.ZodType<T>;
  /** JSON Schema handed to the model for constrained decoding. */
  jsonSchema: Record<string, unknown>;
  temperature?: number;
}

export interface StructuredUsage {
  promptTokens?: number;
  completionTokens?: number;
  durationMs: number;
}

export interface StructuredResult<T> {
  value: T;
  raw: string;
  usage: StructuredUsage;
  /** True when a second attempt was needed to satisfy the schema. */
  retried: boolean;
}

/** A model that returns schema-valid JSON. Ollama today; anything else later. */
export interface StructuredModel {
  readonly provider: string;
  readonly model: string;
  generate<T>(request: StructuredRequest<T>): Promise<StructuredResult<T>>;
}

export class ModelError extends Error {
  constructor(
    message: string,
    readonly kind: "unreachable" | "model_missing" | "bad_response" | "invalid_output" | "http",
    readonly status?: number,
  ) {
    super(message);
    this.name = "ModelError";
  }
}
