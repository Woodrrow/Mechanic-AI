/**
 * Parses DVSA defect text. Since May 2018 every item ends with its inspection
 * manual reference, e.g. "Nearside Front Tyre worn close to legal limit/worn on
 * edge (5.2.3 (e))". Older tests use the previous manual's codes, e.g.
 * "Nearside Front Tyre worn close to the legal limit (4.1.E.1)". Some have none.
 */
import type { DefectLocation, DefectType, ManualReference, MotCategory, ParsedDefect } from "./types";

const CURRENT_REF = /\s*\((\d(?:\.\d+){1,3})\s+\(([a-z])\)(?:\s+\(([ivx]+)\))?\)\s*$/i;
const LEGACY_REF = /\s*\((\d(?:\.\d+){1,3}(?:\.[A-Z]\.\d+|[a-z])?)\)\s*$/;

const LOCATION_WORDS = new Set([
  "nearside", "offside", "front", "rear", "inner", "outer", "upper", "lower", "centre", "center",
  "left", "right", "both", "top", "bottom", "n/s", "o/s", "middle",
]);

export function parseManualReference(raw: string): { reference: ManualReference | null; rest: string } {
  const current = raw.match(CURRENT_REF);
  if (current) {
    const sub = current[3] ? ` (${current[3]})` : "";
    return {
      reference: { code: `${current[1]} (${current[2]})${sub}`, section: current[1], format: "current" },
      rest: raw.slice(0, current.index).trim(),
    };
  }
  const legacy = raw.match(LEGACY_REF);
  if (legacy) {
    const section = legacy[1].match(/^\d(?:\.\d+){1,3}/)?.[0] ?? legacy[1];
    return {
      reference: { code: legacy[1], section, format: "legacy" },
      rest: raw.slice(0, legacy.index).trim(),
    };
  }
  return { reference: null, rest: raw.trim() };
}

export function parseLocation(text: string): { location: DefectLocation; rest: string } {
  const words = text.split(/\s+/);
  const qualifiers: string[] = [];
  let side: DefectLocation["side"] = null;
  let position: DefectLocation["position"] = null;
  let i = 0;
  while (i < words.length && LOCATION_WORDS.has(words[i].toLowerCase())) {
    const w = words[i].toLowerCase();
    if (w === "nearside" || w === "n/s") side = "nearside";
    else if (w === "offside" || w === "o/s") side = "offside";
    else if (w === "front") position = "front";
    else if (w === "rear") position = "rear";
    else qualifiers.push(w);
    i += 1;
  }
  const parts = [side, position, ...qualifiers].filter((p): p is string => Boolean(p));
  const label = parts.length ? parts.join(" ").replace(/^./, (c) => c.toUpperCase()) : null;
  return { location: { side, position, qualifiers, label }, rest: words.slice(i).join(" ").trim() };
}

/** Current manual (2018+): section 5 splits into axles/wheels/tyres (5.1, 5.2) and suspension (5.3). */
function categoryFromCurrent(section: string): MotCategory {
  const [major, minor] = section.split(".");
  switch (major) {
    case "1": return "brakes";
    case "2": return "steering";
    case "3": return "visibility";
    case "4": return "lamps_electrics";
    case "5": return minor === "3" ? "suspension" : "wheels_tyres";
    case "6": return "body_structure";
    case "7": return "other_equipment";
    case "8": return "nuisance_emissions";
    default: return "unknown";
  }
}

/** Legacy manual (pre-May 2018) top-level sections. */
function categoryFromLegacy(section: string): MotCategory {
  const [major, minor] = section.split(".");
  switch (major) {
    case "1": return "lamps_electrics";
    case "2": return Number(minor) <= 3 ? "steering" : "suspension";
    case "3": return "brakes";
    case "4": return "wheels_tyres";
    case "5": return "other_equipment";
    case "6": return "body_structure";
    case "7": return "nuisance_emissions";
    case "8": return "visibility";
    default: return "unknown";
  }
}

const KEYWORD_CATEGORY: Array<[RegExp, MotCategory]> = [
  [/tyre|wheel bearing|road wheel|hub/i, "wheels_tyres"],
  [/brake|abs|caliper|pad|disc|drum/i, "brakes"],
  [/steering|track rod|tie rod|rack/i, "steering"],
  [/suspension|shock absorber|spring|ball joint|anti.?roll|bush|wishbone|arm/i, "suspension"],
  [/lamp|light|bulb|indicator|reflector|battery|wiring|horn|electrical/i, "lamps_electrics"],
  [/wiper|washer|windscreen|mirror|view/i, "visibility"],
  [/seat ?belt|airbag|srs|speedometer|warning lamp/i, "other_equipment"],
  [/exhaust|emission|smoke|oil leak|fluid leak|fuel|noise/i, "nuisance_emissions"],
  [/corro|rust|structure|sill|chassis|body|bumper|door|bonnet|boot|mounting/i, "body_structure"],
];

export function categoryFor(reference: ManualReference | null, text: string): MotCategory {
  if (reference) {
    const c = reference.format === "current" ? categoryFromCurrent(reference.section) : categoryFromLegacy(reference.section);
    if (c !== "unknown") return c;
  }
  return KEYWORD_CATEGORY.find(([re]) => re.test(text))?.[1] ?? "unknown";
}

export function normaliseDefectType(type: string | undefined, dangerous?: boolean): DefectType {
  const t = (type ?? "").toUpperCase().trim();
  if (dangerous || t === "DANGEROUS") return "dangerous";
  if (t === "ADVISORY") return "advisory";
  if (t === "MINOR") return "minor";
  if (t === "MAJOR") return "major";
  if (t === "FAIL") return "fail";
  if (t === "PRS") return "prs";
  if (t === "USER ENTERED") return "user_entered";
  return "other";
}

export function parseDefect(raw: string, type?: string, dangerous?: boolean): ParsedDefect {
  const { reference, rest } = parseManualReference(raw);
  const { location, rest: text } = parseLocation(rest);
  return {
    raw,
    text,
    location,
    reference,
    category: categoryFor(reference, text || raw),
    type: normaliseDefectType(type, dangerous),
    dangerous: Boolean(dangerous) || normaliseDefectType(type) === "dangerous",
  };
}

/** Lower-cased, "(s)" plurals expanded, punctuation squashed: what the knowledge rules match on. */
export function normaliseForMatching(text: string): string {
  return text
    .toLowerCase()
    .replace(/\(s\)/g, "s")
    .replace(/[^a-z0-9/ ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
