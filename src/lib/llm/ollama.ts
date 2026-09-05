/**
 * Ollama client. Runs against a local `ollama serve` (default http://localhost:11434).
 * Uses /api/chat with `format` set to a JSON Schema so decoding is constrained
 * to the shape we want, then validates with zod and retries once with the
 * validation errors if the model still missed.
 *
 * Generation is an offline, developer-run step: the deployed app never calls this.
 */
import type { ZodError } from "zod";
import { ModelError, type StructuredModel, type StructuredRequest, type StructuredResult } from "./types";

export const OLLAMA_DEFAULT_HOST = "http://localhost:11434";
export const OLLAMA_DEFAULT_MODEL = "qwen3:14b";

export interface OllamaOptions {
  model: string;
  host?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  temperature?: number;
  numCtx?: number;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatResponse {
  message?: { role?: string; content?: string; thinking?: string };
  done?: boolean;
  total_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
  error?: string;
}

/** JSON.parse with a fallback to the first {...} block, for models that add chatter. */
export function extractJson(text: string): unknown {
  const trimmed = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new SyntaxError("No JSON object found in model output.");
  }
}

function describeIssues(error: ZodError): string {
  return error.issues
    .slice(0, 12)
    .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n");
}

export class OllamaModel implements StructuredModel {
  readonly provider = "ollama";
  readonly model: string;
  private readonly host: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly temperature: number;
  private readonly numCtx: number;

  constructor(opts: OllamaOptions) {
    this.model = opts.model;
    this.host = (opts.host ?? OLLAMA_DEFAULT_HOST).replace(/\/$/, "");
    this.fetchImpl = opts.fetchImpl ?? fetch;
    this.timeoutMs = opts.timeoutMs ?? 15 * 60_000;
    this.temperature = opts.temperature ?? 0.2;
    this.numCtx = opts.numCtx ?? 8192;
  }

  /** Names of models available locally, for a preflight check. */
  async listModels(): Promise<string[]> {
    const res = await this.request("/api/tags", { method: "GET" });
    const json = (await res.json()) as { models?: Array<{ name?: string; model?: string }> };
    return (json.models ?? []).map((m) => m.name ?? m.model ?? "").filter(Boolean);
  }

  async generate<T>(request: StructuredRequest<T>): Promise<StructuredResult<T>> {
    const messages: ChatMessage[] = [
      { role: "system", content: request.system },
      { role: "user", content: request.prompt },
    ];
    const started = Date.now();
    let retried = false;
    let lastRaw = "";
    let usage = { promptTokens: 0, completionTokens: 0 };

    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await this.chat(messages, request.jsonSchema, request.temperature);
      lastRaw = response.message?.content ?? "";
      usage = {
        promptTokens: usage.promptTokens + (response.prompt_eval_count ?? 0),
        completionTokens: usage.completionTokens + (response.eval_count ?? 0),
      };

      let parsed: unknown;
      try {
        parsed = extractJson(lastRaw);
      } catch (e) {
        if (attempt === 1) throw new ModelError(`Model output was not JSON: ${(e as Error).message}`, "invalid_output");
        messages.push({ role: "assistant", content: lastRaw });
        messages.push({ role: "user", content: "That was not valid JSON. Return only the JSON object, nothing else." });
        retried = true;
        continue;
      }

      const result = request.schema.safeParse(parsed);
      if (result.success) {
        return {
          value: result.data,
          raw: lastRaw,
          usage: { ...usage, durationMs: Date.now() - started },
          retried,
        };
      }
      if (attempt === 1) {
        throw new ModelError(`Model output failed validation:\n${describeIssues(result.error)}`, "invalid_output");
      }
      messages.push({ role: "assistant", content: lastRaw });
      messages.push({
        role: "user",
        content: `That JSON failed validation:\n${describeIssues(result.error)}\nReturn the corrected JSON object only.`,
      });
      retried = true;
    }
    throw new ModelError("Model did not produce valid output.", "invalid_output");
  }

  private async chat(messages: ChatMessage[], jsonSchema: Record<string, unknown>, temperature?: number): Promise<ChatResponse> {
    const res = await this.request("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        messages,
        format: jsonSchema,
        stream: false,
        keep_alive: "10m",
        options: { temperature: temperature ?? this.temperature, num_ctx: this.numCtx },
      }),
    });
    const json = (await res.json().catch(() => null)) as ChatResponse | null;
    if (!json || typeof json !== "object") throw new ModelError("Ollama returned a non-JSON body.", "bad_response");
    if (json.error) throw new ModelError(`Ollama error: ${json.error}`, "bad_response");
    return json;
  }

  private async request(path: string, init: RequestInit): Promise<Response> {
    let res: Response;
    try {
      res = await this.fetchImpl(`${this.host}${path}`, { ...init, signal: AbortSignal.timeout(this.timeoutMs) });
    } catch (cause) {
      const timedOut = cause instanceof Error && cause.name === "TimeoutError";
      throw new ModelError(
        timedOut
          ? `Ollama at ${this.host} did not answer within ${Math.round(this.timeoutMs / 60_000)} minutes. A smaller model or a bigger machine.`
          : `Could not reach Ollama at ${this.host}. Is it running? Start it with: ollama serve`,
        "unreachable",
      );
    }
    if (res.status === 404) {
      const detail = await res.text().catch(() => "");
      if (/not found|pull/i.test(detail) || path === "/api/chat") {
        throw new ModelError(`Model "${this.model}" is not available locally. Run: ollama pull ${this.model}`, "model_missing", 404);
      }
    }
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new ModelError(`Ollama returned HTTP ${res.status}${detail ? `: ${detail.slice(0, 300)}` : ""}`, "http", res.status);
    }
    return res;
  }
}
