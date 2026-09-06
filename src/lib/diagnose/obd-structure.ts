/**
 * OBD-II fault code structure, from the SAE J2012 / ISO 15031-6 standard.
 * The structure is public and unambiguous; the app decodes it rather than
 * looking anything up. Manufacturer-specific codes (the second digit is 1)
 * are NOT in the bundled list and must never be guessed at.
 */
export type CodeSystem = "P" | "C" | "B" | "U";

export const SYSTEM_LABEL: Record<CodeSystem, string> = {
  P: "Powertrain",
  C: "Chassis",
  B: "Body",
  U: "Network",
};

export const SYSTEM_MEANING: Record<CodeSystem, string> = {
  P: "the engine, gearbox and emissions systems",
  C: "the chassis: brakes, steering, suspension and ABS",
  B: "the body: airbags, seats, lighting and comfort systems",
  U: "the network the control units use to talk to each other",
};

/** The third character of a P-code names the subsystem. */
export const POWERTRAIN_SUBSYSTEM: Record<string, string> = {
  "0": "fuel and air metering, plus auxiliary emission controls",
  "1": "fuel and air metering",
  "2": "fuel and air metering, injector circuit",
  "3": "the ignition system or a misfire",
  "4": "auxiliary emission controls",
  "5": "vehicle speed control, idle control and inputs",
  "6": "the computer output circuits",
  "7": "the transmission",
  "8": "the transmission",
  "9": "the transmission or control modules",
  A: "hybrid propulsion",
  B: "hybrid propulsion",
  C: "hybrid propulsion",
};

export interface DecodedCode {
  code: string;
  system: CodeSystem;
  /** "generic" = defined by the standard; "manufacturer" = specific to the make. */
  scope: "generic" | "manufacturer";
  subsystem: string | null;
  /** The bundled J2012 description, when we have one. */
  description: string | null;
}

export const CODE_PATTERN = /^[PCBU][0-3][0-9A-F]{3}$/;

export function normaliseCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function isPlausibleCode(code: string): boolean {
  return CODE_PATTERN.test(code);
}
