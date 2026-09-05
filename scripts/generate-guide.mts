/**
 * Generate a job guide for one car with a local Ollama model and save it as a
 * draft in data/guides. Run on your machine, never in production.
 *
 *   npm run guide:generate -- --registration "AB15 CDE" --fixtures          # demo car
 *   npm run guide:generate -- --registration "AB15 CDE"                     # live DVSA lookup
 *   npm run guide:generate -- --make FORD --model FOCUS --year 2015 --engine 1596 --fuel petrol
 *   npm run guide:generate -- ... --model qwen3:32b --host http://localhost:11434
 *   npm run guide:generate -- ... --dry-run                                 # print the prompt only
 *
 * Then read the draft, and when you are satisfied:
 *   npm run guide:review -- --file data/guides/<file>.json --by "Your name"
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { getJob, JOBS } from "../src/lib/jobs/catalogue";
import { generateGuide } from "../src/lib/jobs/generate";
import { buildGrounding } from "../src/lib/jobs/grounding";
import { modelOutputJsonSchema } from "../src/lib/jobs/guide-schema";
import { buildUserPrompt, SYSTEM_PROMPT } from "../src/lib/jobs/prompt";
import { FixtureModel } from "../src/lib/llm/fixture-model";
import { OLLAMA_DEFAULT_HOST, OLLAMA_DEFAULT_MODEL, OllamaModel } from "../src/lib/llm/ollama";
import { ModelError } from "../src/lib/llm/types";
import type { StructuredModel } from "../src/lib/llm/types";
import { lookupByRegistration, lookupDepsFromEnv } from "../src/lib/vehicle/lookup";
import type { FuelType, VehicleCore } from "../src/lib/vehicle/types";
import { loadProjectEnv } from "./lib/dotenv.mts";

loadProjectEnv();

const { values } = parseArgs({
  options: {
    registration: { type: "string" },
    fixtures: { type: "boolean", default: false },
    make: { type: "string" },
    model: { type: "string" },
    year: { type: "string" },
    engine: { type: "string" },
    fuel: { type: "string" },
    job: { type: "string", default: "front-brake-pads" },
    "ollama-model": { type: "string" },
    host: { type: "string" },
    out: { type: "string", default: "data/guides" },
    "dry-run": { type: "boolean", default: false },
    provider: { type: "string", default: "ollama" },
    "fixture-file": { type: "string" },
    force: { type: "boolean", default: false },
  },
  strict: true,
});

function fail(message: string, code = 1): never {
  console.error(`\n${message}`);
  process.exit(code);
}

async function resolveVehicle(): Promise<VehicleCore> {
  if (values.registration) {
    const deps = { ...lookupDepsFromEnv(), useFixtures: values.fixtures || lookupDepsFromEnv().useFixtures };
    const result = await lookupByRegistration(values.registration, deps);
    if (!result.ok) fail(`Lookup failed: ${result.error.code}: ${result.error.message}`);
    const c = result.value.candidate;
    return {
      country: c.country,
      registration: c.registration,
      vin: c.vin,
      make: c.make,
      makeRaw: c.makeRaw,
      model: c.model,
      year: c.year,
      engineCc: c.engineCc,
      fuel: c.fuel,
      transmission: c.transmission,
      colour: c.colour,
      uk: c.uk,
      provenance: c.provenance,
      sources: c.sources,
    };
  }
  if (!values.make || !values.model || !values.year) {
    fail("Give --registration, or --make --model --year (with optional --engine and --fuel).");
  }
  return {
    country: "GB",
    registration: null,
    vin: null,
    make: values.make,
    makeRaw: values.make.toUpperCase(),
    model: values.model,
    year: Number(values.year),
    engineCc: values.engine ? Number(values.engine) : null,
    fuel: (values.fuel as FuelType | undefined) ?? "unknown",
    transmission: "unknown",
    colour: null,
    uk: null,
    provenance: [],
    sources: {},
  };
}

async function resolveModel(): Promise<StructuredModel> {
  if (values.provider === "fixture") {
    if (!values["fixture-file"]) fail("--provider fixture needs --fixture-file <path to {scope, content} JSON>");
    const raw = JSON.parse(await readFile(values["fixture-file"], "utf8")) as { scope?: unknown; content?: unknown };
    return new FixtureModel(raw.scope && raw.content ? { scope: raw.scope, content: raw.content } : raw);
  }
  const model = new OllamaModel({
    model: values["ollama-model"] ?? process.env.OLLAMA_MODEL ?? OLLAMA_DEFAULT_MODEL,
    host: values.host ?? process.env.OLLAMA_HOST ?? OLLAMA_DEFAULT_HOST,
  });
  try {
    const available = await model.listModels();
    const wanted = model.model;
    const present = available.some((m) => m === wanted || m === `${wanted}:latest` || m.split(":")[0] === wanted.split(":")[0]);
    if (!present) {
      console.warn(`Model "${wanted}" is not in \`ollama list\` (${available.join(", ") || "none"}). Pull it with: ollama pull ${wanted}`);
    }
  } catch (e) {
    fail(e instanceof ModelError ? e.message : String(e));
  }
  return model;
}

async function main(): Promise<void> {
  const job = getJob(values.job ?? "");
  if (!job) fail(`Unknown job "${values.job}". Known: ${Object.keys(JOBS).join(", ")}`);

  const vehicle = await resolveVehicle();
  if (!vehicle.model || !vehicle.year) fail("The vehicle needs a model and a year before a guide can be generated.");

  console.log(`Vehicle: ${vehicle.year} ${vehicle.makeRaw} ${vehicle.model} ${vehicle.engineCc ?? "?"}cc ${vehicle.fuel}`);
  console.log(`Job:     ${job.title} (${job.id}, ${job.tier.toUpperCase()})`);

  if (values["dry-run"]) {
    const grounding = buildGrounding(vehicle, job);
    console.log("\n===== SYSTEM PROMPT =====\n" + SYSTEM_PROMPT);
    console.log("\n===== USER PROMPT =====\n" + buildUserPrompt(job, grounding));
    console.log("\n===== JSON SCHEMA =====\n" + JSON.stringify(modelOutputJsonSchema(), null, 2));
    return;
  }

  const model = await resolveModel();
  console.log(`Model:   ${model.provider} / ${model.model}`);
  console.log("Generating… (a 14B model on a laptop takes a few minutes)");

  let generated;
  try {
    generated = await generateGuide(vehicle, job, model);
  } catch (e) {
    fail(e instanceof ModelError ? `${e.kind}: ${e.message}` : String(e));
  }
  const { record, fileName } = generated;

  const outDir = path.resolve(process.cwd(), values.out ?? "data/guides");
  await mkdir(outDir, { recursive: true });
  const target = path.join(outDir, fileName);
  if (existsSync(target) && !values.force) {
    fail(`${path.relative(process.cwd(), target)} already exists. Use --force to overwrite, or review the existing file.`);
  }
  await writeFile(target, JSON.stringify(record, null, 2) + "\n");

  const g = record.generatedBy;
  console.log(`\nSaved ${path.relative(process.cwd(), target)}`);
  console.log(`Status: ${record.status.toUpperCase()}  confidence: ${record.content.confidence}  steps: ${record.content.steps.length}`);
  if (g.durationMs !== null) console.log(`Took ${Math.round(g.durationMs / 1000)}s, ${g.promptTokens ?? "?"} prompt + ${g.completionTokens ?? "?"} completion tokens`);
  if (record.content.notesForReviewer) console.log(`\nReviewer notes from the model:\n  ${record.content.notesForReviewer}`);
  if (!record.specCheck.ok) {
    console.log("\nBLOCKED: the guide states figures that are not in the grounding facts:");
    for (const v of record.specCheck.violations) console.log(`  - ${v.kind} at ${v.path}: "${v.text}"`);
    console.log("Fix the text (or regenerate) before this guide can be reviewed.");
    process.exitCode = 2;
    return;
  }
  console.log(`\nRead it end to end against the car, then:\n  npm run guide:review -- --file ${path.relative(process.cwd(), target)} --by "Your name"`);
}

main().catch((e: unknown) => fail(String(e)));
