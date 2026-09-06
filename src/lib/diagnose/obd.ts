/**
 * Decoding an OBD-II code. Structure comes from the standard; the description
 * comes from the bundled generic list. A manufacturer-specific code (second
 * digit 1) is decoded structurally and never guessed at.
 */
import { GENERIC_CODES } from "./obd-codes";
import {
  isPlausibleCode,
  normaliseCode,
  POWERTRAIN_SUBSYSTEM,
  SYSTEM_MEANING,
  type CodeSystem,
  type DecodedCode,
} from "./obd-structure";

export interface CodeExplanation extends DecodedCode {
  /** Plain-English sentence about what the code means. */
  plain: string;
  /** What to do with it. */
  advice: string;
  /** Job ids in the catalogue this code points at. */
  jobIds: string[];
  /** True when the underlying system is one we refuse to guide. */
  referOut: boolean;
}

const CODE_JOBS: Array<{ test: RegExp; jobIds: string[] }> = [
  { test: /^P030[0-9]$/, jobIds: ["spark-plugs", "read-fault-codes"] },
  { test: /^P042[0-9]$|^P24[0-9A-F]{2}$|^P2002$|^P2003$|^P20EE$/, jobIds: ["emissions-diagnosis"] },
  { test: /^P01(3[0-9]|4[0-1])$|^P219[0-9]$|^P209[0-9]$/, jobIds: ["emissions-diagnosis", "read-fault-codes"] },
  { test: /^P017[0-9]$|^P010[0-9]$|^P2279$/, jobIds: ["engine-air-filter", "read-fault-codes"] },
  { test: /^P011[0-9]$|^P0128$|^P0480$/, jobIds: ["coolant-drain-and-refill", "top-up-fluids"] },
  { test: /^P056[23]$/, jobIds: ["battery-replacement", "auxiliary-drive-belt"] },
  { test: /^P0217$/, jobIds: ["top-up-fluids", "coolant-drain-and-refill"] },
  { test: /^P0521$/, jobIds: ["engine-oil-and-filter", "top-up-fluids"] },
  { test: /^P02[0-9]{2}$|^P019[0-9]$/, jobIds: ["fuel-injectors-rail"] },
  { test: /^C00[0-9]{2}$/, jobIds: ["wheel-bearing", "read-fault-codes"] },
  { test: /^B0[0-9]{3}$/, jobIds: ["airbag-srs"] },
];

export function decodeCode(raw: string): CodeExplanation | null {
  const code = normaliseCode(raw);
  if (!isPlausibleCode(code)) return null;

  const system = code.charAt(0) as CodeSystem;
  const scope = code.charAt(1) === "1" ? "manufacturer" : "generic";
  const subsystem = system === "P" ? (POWERTRAIN_SUBSYSTEM[code.charAt(2)] ?? null) : null;
  const description = GENERIC_CODES[code] ?? null;
  const jobIds = CODE_JOBS.find((entry) => entry.test.test(code))?.jobIds ?? [];
  const referOut = system === "B";

  let plain: string;
  let advice: string;
  if (description) {
    plain = `${description}.`;
    advice =
      "A code names a circuit, not a part to buy. It tells you where to look; the fault can be the sensor, its wiring, its connector, or the thing it is measuring.";
  } else if (scope === "manufacturer") {
    plain = `This is a manufacturer-specific code for ${SYSTEM_MEANING[system]}. Its meaning is set by the carmaker, not by the standard, so we cannot tell you what it means.`;
    advice = "Search for this code together with your exact make and model, or ask a garage to read it with the manufacturer's tool.";
  } else {
    plain = `A standard code for ${SYSTEM_MEANING[system]}${subsystem ? `, in ${subsystem}` : ""}. We do not have this exact code's description bundled.`;
    advice = "Search for the code number itself: the generic descriptions are published as part of the standard.";
  }
  if (referOut) {
    advice = "This is in the airbag and restraint system. Do not work on it: have it read and repaired professionally.";
  }

  return { code, system, scope, subsystem, description, plain, advice, jobIds, referOut };
}

export function decodeCodes(input: string): { codes: CodeExplanation[]; unrecognised: string[] } {
  const parts = input
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter(Boolean);
  const codes: CodeExplanation[] = [];
  const unrecognised: string[] = [];
  const seen = new Set<string>();
  for (const part of parts) {
    const decoded = decodeCode(part);
    if (decoded && !seen.has(decoded.code)) {
      seen.add(decoded.code);
      codes.push(decoded);
    } else if (!decoded) {
      unrecognised.push(part);
    }
  }
  return { codes, unrecognised };
}
