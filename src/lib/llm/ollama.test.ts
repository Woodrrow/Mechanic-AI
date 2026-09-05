import { describe, expect, it } from "vitest";
import { z } from "zod";
import { extractJson, OllamaModel } from "./ollama";
import { ModelError } from "./types";

const Schema = z.object({ answer: z.string(), n: z.number().int() });
const jsonSchema = z.toJSONSchema(Schema) as Record<string, unknown>;

type Handler = (url: string, init?: RequestInit) => Response | Promise<Response>;
const fakeFetch = (handler: Handler): typeof fetch =>
  (async (input: string | URL | Request, init?: RequestInit) =>
    handler(typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url, init)) as unknown as typeof fetch;

const chatReply = (content: string, extra: Record<string, unknown> = {}) =>
  new Response(JSON.stringify({ message: { role: "assistant", content }, done: true, prompt_eval_count: 100, eval_count: 50, ...extra }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

describe("extractJson", () => {
  it("parses clean JSON, fenced chatter and thinking blocks", () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
    expect(extractJson('Sure! Here it is:\n```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(extractJson('<think>hmm</think>{"a":2}')).toEqual({ a: 2 });
    expect(() => extractJson("no json here")).toThrow();
  });
});

describe("OllamaModel", () => {
  it("posts a constrained chat request and validates the reply", async () => {
    let captured: { url: string; body: Record<string, unknown> } | null = null;
    const model = new OllamaModel({
      model: "qwen3:14b",
      host: "http://ollama.test:11434/",
      fetchImpl: fakeFetch((url, init) => {
        captured = { url, body: JSON.parse(String(init?.body)) as Record<string, unknown> };
        return chatReply('{"answer":"yes","n":3}');
      }),
    });
    const result = await model.generate({ system: "sys", prompt: "hi", schema: Schema, jsonSchema });
    expect(result.value).toEqual({ answer: "yes", n: 3 });
    expect(result.retried).toBe(false);
    expect(result.usage.promptTokens).toBe(100);
    expect(captured!.url).toBe("http://ollama.test:11434/api/chat");
    expect(captured!.body.model).toBe("qwen3:14b");
    expect(captured!.body.stream).toBe(false);
    expect(captured!.body.format).toEqual(jsonSchema);
    expect((captured!.body.messages as Array<{ role: string }>).map((m) => m.role)).toEqual(["system", "user"]);
  });

  it("retries once with the validation errors, then gives up", async () => {
    let calls = 0;
    const model = new OllamaModel({
      model: "m",
      fetchImpl: fakeFetch((_url, init) => {
        calls += 1;
        const messages = (JSON.parse(String(init?.body)) as { messages: Array<{ role: string; content: string }> }).messages;
        if (calls === 1) return chatReply('{"answer":"yes","n":"three"}');
        expect(messages[messages.length - 1].content).toMatch(/failed validation/);
        return chatReply('{"answer":"yes","n":3}');
      }),
    });
    const result = await model.generate({ system: "s", prompt: "p", schema: Schema, jsonSchema });
    expect(result.retried).toBe(true);
    expect(calls).toBe(2);

    const stubborn = new OllamaModel({ model: "m", fetchImpl: fakeFetch(() => chatReply("garbage")) });
    await expect(stubborn.generate({ system: "s", prompt: "p", schema: Schema, jsonSchema })).rejects.toMatchObject({ kind: "invalid_output" });
  });

  it("explains a missing model, a stopped server and an Ollama error", async () => {
    const missing = new OllamaModel({
      model: "nope:7b",
      fetchImpl: fakeFetch(() => new Response(JSON.stringify({ error: "model 'nope:7b' not found, try pulling it first" }), { status: 404 })),
    });
    await expect(missing.generate({ system: "s", prompt: "p", schema: Schema, jsonSchema })).rejects.toMatchObject({
      kind: "model_missing",
      message: expect.stringContaining("ollama pull nope:7b"),
    });

    const down = new OllamaModel({
      model: "m",
      fetchImpl: fakeFetch(() => {
        throw new TypeError("fetch failed");
      }),
    });
    await expect(down.generate({ system: "s", prompt: "p", schema: Schema, jsonSchema })).rejects.toMatchObject({
      kind: "unreachable",
      message: expect.stringContaining("ollama serve"),
    });

    const errored = new OllamaModel({
      model: "m",
      fetchImpl: fakeFetch(() => new Response(JSON.stringify({ error: "out of memory" }), { status: 200 })),
    });
    const err = await errored.generate({ system: "s", prompt: "p", schema: Schema, jsonSchema }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ModelError);
    expect((err as ModelError).message).toContain("out of memory");
  });

  it("lists local models", async () => {
    const model = new OllamaModel({
      model: "m",
      fetchImpl: fakeFetch(() => new Response(JSON.stringify({ models: [{ name: "qwen3:14b" }, { model: "llama3.1:8b" }] }), { status: 200 })),
    });
    expect(await model.listModels()).toEqual(["qwen3:14b", "llama3.1:8b"]);
  });
});
