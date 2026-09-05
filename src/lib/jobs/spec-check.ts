/**
 * The automated check behind the rule "never invent a torque specification,
 * fluid capacity or part number". Every number-with-unit in the guide text
 * must be traceable to the grounding facts; every figure entry must have a
 * null value unless grounded. Tool sizes (a 7 mm hex key) are allowed:
 * "mm" only counts as a spec near words like minimum, thickness or wear limit.
 */
import type { ModelGuideOutput, SpecViolation } from "./guide-schema";

interface Pattern {
  kind: SpecViolation["kind"];
  re: RegExp;
  /** Extra condition on the surrounding text. */
  context?: (window: string) => boolean;
}

const NUMBER = String.raw`\d+(?:[.,]\d+)?`;

const PATTERNS: Pattern[] = [
  { kind: "torque", re: new RegExp(String.raw`\b(${NUMBER})\s?(?:nm|n·m|n\.m|newton[- ]?met(?:re|er)s?|lb[- ]?ft|ft[- ]?lbs?|foot[- ]pounds?)\b`, "gi") },
  { kind: "capacity", re: new RegExp(String.raw`\b(${NUMBER})\s?(?:litres?|liters?|ltrs?|l|ml|millilitres?|cc)\b`, "gi") },
  { kind: "pressure", re: new RegExp(String.raw`\b(${NUMBER})\s?(?:bar|psi|kpa)\b`, "gi") },
  {
    kind: "thickness",
    re: new RegExp(String.raw`\b(${NUMBER})\s?mm\b`, "gi"),
    context: (w) => /minimum|\bmin\b|thickness|thick|wear limit|worn to|tread|below/i.test(w),
  },
  {
    kind: "part_number",
    re: /\b(?:part|p\/n|oem|oe)\s*(?:no\.?|number|#|code)?\s*[:#-]?\s*([A-Z0-9][A-Z0-9-]{4,})\b/gi,
  },
  // Manufacturer-style codes such as BV61-2K021-AA
  { kind: "part_number", re: /\b([A-Z0-9]{2,4}-[A-Z0-9]{3,6}-[A-Z]{1,2})\b/g },
];

function normaliseNumber(n: string): string {
  const v = Number(n.replace(",", "."));
  return Number.isFinite(v) ? String(v) : n;
}

export function collectGuideText(output: ModelGuideOutput): Array<{ path: string; text: string }> {
  const out: Array<{ path: string; text: string }> = [];
  const c = output.content;
  const push = (path: string, text: string | null | undefined) => {
    if (text) out.push({ path, text });
  };
  push("scope.variantNotes", output.scope.variantNotes);
  push("content.summary", c.summary);
  push("content.partLocation", c.partLocation);
  c.toolsExtra.forEach((t, i) => {
    push(`content.toolsExtra[${i}].name`, t.name);
    push(`content.toolsExtra[${i}].why`, t.why);
  });
  c.partsNeeded.forEach((p, i) => {
    push(`content.partsNeeded[${i}].name`, p.name);
    push(`content.partsNeeded[${i}].notes`, p.notes);
  });
  c.steps.forEach((s, i) => {
    push(`content.steps[${i}].title`, s.title);
    push(`content.steps[${i}].instruction`, s.instruction);
    push(`content.steps[${i}].caution`, s.caution);
    push(`content.steps[${i}].checkpoint`, s.checkpoint);
  });
  c.figures.forEach((f, i) => push(`content.figures[${i}].note`, f.note));
  c.gotchas.forEach((g, i) => push(`content.gotchas[${i}]`, g));
  c.verification.forEach((v, i) => push(`content.verification[${i}]`, v));
  c.ifWrong.forEach((v, i) => push(`content.ifWrong[${i}]`, v));
  Object.entries(c.diagramLabels).forEach(([k, v]) => push(`content.diagramLabels.${k}`, v));
  push("content.notesForReviewer", c.notesForReviewer);
  return out;
}

export function checkText(path: string, text: string, allowedNumbers: Set<string>): SpecViolation[] {
  const violations: SpecViolation[] = [];
  for (const pattern of PATTERNS) {
    pattern.re.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.re.exec(text)) !== null) {
      const captured = match[1] ?? match[0];
      if (pattern.kind !== "part_number" && allowedNumbers.has(normaliseNumber(captured))) continue;
      if (pattern.context) {
        const start = Math.max(0, match.index - 40);
        const window = text.slice(start, match.index + match[0].length + 40);
        if (!pattern.context(window)) continue;
      }
      violations.push({ path, kind: pattern.kind, text: match[0] });
    }
  }
  return violations;
}

export interface GroundedFigure {
  name: string;
  unit: string;
  value: number;
  source: string;
}

export interface SpecCheckInput {
  /** Numbers that appear in the grounding facts (engine cc, years, litres...). */
  allowedNumbers: Iterable<string | number>;
  /** Figures we actually have a source for. Usually empty. */
  groundedFigures: GroundedFigure[];
}

export function checkGuide(output: ModelGuideOutput, input: SpecCheckInput): { ok: boolean; violations: SpecViolation[] } {
  const allowed = new Set([...input.allowedNumbers].map((n) => normaliseNumber(String(n))));
  const violations: SpecViolation[] = [];
  for (const { path, text } of collectGuideText(output)) {
    violations.push(...checkText(path, text, allowed));
  }
  output.content.figures.forEach((figure, i) => {
    if (figure.value === null) return;
    const grounded = input.groundedFigures.find(
      (g) => g.name.toLowerCase() === figure.name.toLowerCase() && g.value === figure.value,
    );
    if (!grounded) {
      violations.push({
        path: `content.figures[${i}].value`,
        kind: "figure_value",
        text: `${figure.name}: ${figure.value} ${figure.unit}`,
      });
    }
  });
  return { ok: violations.length === 0, violations };
}
