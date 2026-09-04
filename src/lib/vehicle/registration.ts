/**
 * UK registration marks. We normalise aggressively and validate loosely:
 * DVLA is the authority on whether a mark exists, so the goal here is only
 * to catch obvious typos before spending an API call.
 */

export type RegistrationFormat = "current" | "prefix" | "suffix" | "dateless";

export function normaliseRegistration(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

const FORMATS: Array<{ name: RegistrationFormat; re: RegExp; display: (r: string) => string }> = [
  // 2001-present: AB12 CDE
  { name: "current", re: /^[A-Z]{2}\d{2}[A-Z]{3}$/, display: (r) => `${r.slice(0, 4)} ${r.slice(4)}` },
  // 1983-2001: A123 BCD
  { name: "prefix", re: /^[A-Z]\d{1,3}[A-Z]{3}$/, display: (r) => `${r.slice(0, -3)} ${r.slice(-3)}` },
  // 1963-1983: ABC 123A
  { name: "suffix", re: /^[A-Z]{3}\d{1,3}[A-Z]$/, display: (r) => `${r.slice(0, 3)} ${r.slice(3)}` },
  // Dateless and Northern Ireland: ABC 123, 123 ABC, ABC 1234
  { name: "dateless", re: /^(?:[A-Z]{1,3}\d{1,4}|\d{1,4}[A-Z]{1,3})$/, display: (r) => r },
];

export function classifyRegistration(normalised: string): RegistrationFormat | null {
  return FORMATS.find((f) => f.re.test(normalised))?.name ?? null;
}

export function isPlausibleRegistration(normalised: string): boolean {
  return normalised.length >= 2 && normalised.length <= 7 && classifyRegistration(normalised) !== null;
}

/** Adds the conventional space for display, e.g. AB12CDE -> "AB12 CDE". */
export function formatRegistration(input: string): string {
  const reg = normaliseRegistration(input);
  const format = FORMATS.find((f) => f.re.test(reg));
  return format ? format.display(reg) : reg;
}
