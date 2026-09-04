/**
 * VIN handling. The ISO 3779 check digit (position 9) is mandatory only in
 * North America; European manufacturers use that position freely, so the
 * check digit is enforced only for North American VINs.
 */

export type VinRegion =
  | "north_america"
  | "europe"
  | "asia"
  | "oceania"
  | "africa"
  | "south_america"
  | "unknown";

export function normaliseVin(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function isPlausibleVin(normalised: string): boolean {
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(normalised);
}

export function vinRegion(vin: string): VinRegion {
  const c = vin.charAt(0);
  if (/[1-5]/.test(c)) return "north_america";
  if (/[S-Z]/.test(c)) return "europe";
  if (/[J-R]/.test(c)) return "asia";
  if (/[6-7]/.test(c)) return "oceania";
  if (/[A-H]/.test(c)) return "africa";
  if (/[8-9]/.test(c)) return "south_america";
  return "unknown";
}

const TRANSLITERATION: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
  J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
};
const WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

export function vinCheckDigit(vin: string): string {
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const ch = vin.charAt(i);
    const value = /\d/.test(ch) ? Number(ch) : (TRANSLITERATION[ch] ?? 0);
    sum += value * WEIGHTS[i];
  }
  const remainder = sum % 11;
  return remainder === 10 ? "X" : String(remainder);
}

export function vinCheckDigitValid(vin: string): boolean {
  return isPlausibleVin(vin) && vin.charAt(8) === vinCheckDigit(vin);
}

/** Model-year letter/digit at position 10. Ambiguous across 30-year cycles, so treat as a hint only. */
export function vinModelYearHint(vin: string): number[] {
  const codes = "ABCDEFGHJKLMNPRSTVWXY123456789";
  const idx = codes.indexOf(vin.charAt(9));
  if (idx < 0) return [];
  return [1980 + idx, 2010 + idx];
}
