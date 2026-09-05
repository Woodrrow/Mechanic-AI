import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Minimal .env loader for the CLI scripts (Next loads these itself for the app). */
export function loadDotEnv(file: string): void {
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

export function loadProjectEnv(): void {
  loadDotEnv(resolve(process.cwd(), ".env.local"));
  loadDotEnv(resolve(process.cwd(), ".env"));
}
