/** A StructuredModel that returns a canned value. For tests and dry runs. */
import type { StructuredModel, StructuredRequest, StructuredResult } from "./types";

export class FixtureModel implements StructuredModel {
  readonly provider = "fixture";
  readonly model = "fixture";

  constructor(private readonly value: unknown) {}

  async generate<T>(request: StructuredRequest<T>): Promise<StructuredResult<T>> {
    const parsed = request.schema.parse(this.value);
    return { value: parsed, raw: JSON.stringify(this.value), usage: { durationMs: 0 }, retried: false };
  }
}
