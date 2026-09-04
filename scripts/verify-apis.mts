/**
 * Phase 1 acceptance script: call each live provider with the credentials in
 * .env.local and print the raw payload next to what the merge layer made of it.
 * Run it the day the keys arrive, before trusting anything the UI shows.
 *
 *   npm run verify:apis -- --reg "AB12 CDE"
 *   npm run verify:apis -- --vin WF0XXXXXXXXXXXXXX
 *   npm run verify:apis -- --reg "AB12 CDE" --uat     # DVLA UAT host with a UAT key
 *
 * Nothing here is cached or stored; registration marks are printed to your terminal only.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fetchVesVehicle, DVLA_VES_UAT_BASE_URL } from "../src/lib/providers/dvla-ves";
import { fetchMotVehicleByRegistration, fetchMotVehicleByVin } from "../src/lib/providers/dvsa-mot";
import { PROVIDER_LABEL, type ProviderError } from "../src/lib/providers/errors";
import { fetchVpicDecode } from "../src/lib/providers/nhtsa-vpic";
import { lookupByRegistration, lookupByVin, lookupDepsFromEnv } from "../src/lib/vehicle/lookup";
import { normaliseRegistration } from "../src/lib/vehicle/registration";
import { normaliseVin } from "../src/lib/vehicle/vin";

function loadDotEnv(file: string): void {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || line.trim().startsWith("#")) continue;
    let value = m[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[m[1]] === undefined) process.env[m[1]] = value;
  }
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function flag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function section(title: string): void {
  console.log(`\n${"=".repeat(72)}\n${title}\n${"=".repeat(72)}`);
}

function describeFailure(e: ProviderError): string {
  return `${PROVIDER_LABEL[e.provider]} -> ${e.kind}${e.status ? ` (HTTP ${e.status})` : ""}: ${e.message}`;
}

async function timed<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const started = performance.now();
  const value = await fn();
  console.log(`[${label}] ${Math.round(performance.now() - started)} ms`);
  return value;
}

async function main(): Promise<void> {
  loadDotEnv(resolve(process.cwd(), ".env.local"));
  loadDotEnv(resolve(process.cwd(), ".env"));

  const deps = lookupDepsFromEnv();
  if (flag("uat")) deps.vesBaseUrl = DVLA_VES_UAT_BASE_URL;
  deps.useFixtures = false;

  section("Configuration");
  console.log(`DVLA VES key:        ${deps.vesApiKey ? "set" : "MISSING"}  (${deps.vesBaseUrl ?? "production"})`);
  console.log(`DVSA MOT creds:      ${deps.mot ? "set" : "MISSING"}`);
  console.log(`NHTSA vPIC:          no key needed`);

  const reg = arg("reg");
  const vin = arg("vin");
  if (!reg && !vin) {
    console.log('\nUsage: npm run verify:apis -- --reg "AB12 CDE" [--vin ...] [--uat]');
    process.exitCode = 1;
    return;
  }

  if (reg) {
    const registration = normaliseRegistration(reg);
    section(`Registration ${registration}`);

    if (deps.vesApiKey) {
      const ves = await timed("DVLA VES", () =>
        fetchVesVehicle(registration, { apiKey: deps.vesApiKey as string, baseUrl: deps.vesBaseUrl }),
      );
      console.log(ves.ok ? JSON.stringify(ves.value, null, 2) : describeFailure(ves.error));
    } else {
      console.log("DVLA VES skipped: DVLA_VES_API_KEY not set");
    }

    if (deps.mot) {
      const mot = await timed("DVSA MOT", () => fetchMotVehicleByRegistration(registration, deps.mot!));
      if (mot.ok) {
        const { motTests, ...vehicle } = mot.value;
        console.log(JSON.stringify(vehicle, null, 2));
        console.log(`motTests: ${motTests?.length ?? 0} on record`);
        for (const t of motTests ?? []) {
          const advisories = (t.defects ?? []).filter((d) => d.type.toUpperCase() === "ADVISORY").length;
          console.log(`  ${t.completedDate.slice(0, 10)} ${t.testResult.padEnd(6)} ${t.odometerValue ?? "?"} ${t.odometerUnit ?? ""}  defects=${t.defects?.length ?? 0} advisories=${advisories}`);
        }
      } else {
        console.log(describeFailure(mot.error));
      }
    } else {
      console.log("DVSA MOT skipped: DVSA_MOT_* not set");
    }

    section("Merged candidate (what the app would show)");
    const merged = await lookupByRegistration(registration, deps);
    if (merged.ok) {
      const { candidate, providers } = merged.value;
      console.log(JSON.stringify({ ...candidate, sources: "(omitted)" }, null, 2));
      console.log("providers:", JSON.stringify(providers));
    } else {
      console.log(`lookup error: ${merged.error.code} (${merged.error.status}) ${merged.error.message}`);
    }
  }

  if (vin) {
    const normalised = normaliseVin(vin);
    section(`VIN ${normalised}`);

    const vpic = await timed("NHTSA vPIC", () => fetchVpicDecode(normalised, { baseUrl: deps.vpicBaseUrl }));
    if (vpic.ok) {
      const { raw, ...decoded } = vpic.value;
      console.log(JSON.stringify(decoded, null, 2));
      const populated = Object.entries(raw).filter(([, v]) => v && v.trim() !== "").length;
      console.log(`raw fields populated: ${populated}/${Object.keys(raw).length}`);
    } else {
      console.log(describeFailure(vpic.error));
    }

    if (deps.mot) {
      const mot = await timed("DVSA MOT by VIN", () => fetchMotVehicleByVin(normalised, deps.mot!));
      console.log(mot.ok ? JSON.stringify({ ...mot.value, motTests: `(${mot.value.motTests?.length ?? 0} tests)` }, null, 2) : describeFailure(mot.error));
    }

    section("Merged candidate (what the app would show)");
    const merged = await lookupByVin(normalised, deps);
    if (merged.ok) {
      const { candidate, providers } = merged.value;
      console.log(JSON.stringify({ ...candidate, sources: "(omitted)" }, null, 2));
      console.log("providers:", JSON.stringify(providers));
    } else {
      console.log(`lookup error: ${merged.error.code} (${merged.error.status}) ${merged.error.message}`);
    }
  }
}

main().catch((e: unknown) => {
  console.error(e);
  process.exitCode = 1;
});
