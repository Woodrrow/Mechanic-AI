/**
 * The ranking engine. Deterministic and explainable: every cause carries the
 * reasons it is ranked where it is, so the user can disagree with it.
 *
 * Evidence comes from three places:
 *   1. the answers to the interview,
 *   2. this car's own MOT advisories (Phase 2), and
 *   3. any OBD-II codes the user pasted in.
 */
import type { HistoryAnalysis } from "@/lib/mot/types";
import { CAUSES } from "./causes";
import type { CodeExplanation } from "./obd";
import type {
  Confidence,
  DiagnosisResult,
  Effect,
  RankedCause,
  SymptomDefinition,
} from "./types";

export interface DiagnoseInput {
  symptom: SymptomDefinition;
  /** question id -> answer id(s) */
  answers: Record<string, string | string[]>;
  history?: HistoryAnalysis | null;
  codes?: CodeExplanation[];
}

function add(into: Map<string, number>, effect: Effect, factor = 1): void {
  for (const [causeId, weight] of Object.entries(effect)) {
    into.set(causeId, (into.get(causeId) ?? 0) + weight * factor);
  }
}

/** How much an MOT item corroborating a cause is worth, by how recent it is. */
export function motWeight(monthsSince: number): number {
  if (monthsSince <= 6) return 5;
  if (monthsSince <= 14) return 4;
  if (monthsSince <= 30) return 2;
  return 1;
}

function confidenceFor(score: number, top: number): Confidence {
  if (top <= 0) return "possible";
  const share = score / top;
  if (share >= 0.75) return "likely";
  if (share >= 0.4) return "possible";
  return "less likely";
}

export function diagnose(input: DiagnoseInput): DiagnosisResult {
  const { symptom, answers, history, codes = [] } = input;
  const scores = new Map<string, number>();
  const reasons = new Map<string, string[]>();
  const motEvidence = new Map<string, string[]>();

  const noteReason = (causeId: string, text: string) => {
    const list = reasons.get(causeId) ?? [];
    if (!list.includes(text)) list.push(text);
    reasons.set(causeId, list);
  };

  add(scores, symptom.priors);

  // 1. Interview answers.
  let answered = 0;
  for (const question of symptom.questions) {
    const given = answers[question.id];
    if (given === undefined) continue;
    const chosen = Array.isArray(given) ? given : [given];
    if (chosen.length === 0) continue;
    answered += 1;
    for (const answerId of chosen) {
      const effect = symptom.effects[answerId];
      if (!effect) continue;
      add(scores, effect);
      const label = question.options.find((o) => o.id === answerId)?.label;
      if (!label) continue;
      for (const [causeId, weight] of Object.entries(effect)) {
        if (weight > 0) noteReason(causeId, `You said: ${label.toLowerCase()}.`);
        else if (weight < 0) noteReason(causeId, `Argues against this: ${label.toLowerCase()}.`);
      }
    }
  }

  // 2. This car's MOT record.
  if (history) {
    for (const item of history.openItems) {
      const ruleId = item.defect.explanation.ruleId;
      if (!ruleId) continue;
      for (const cause of Object.values(CAUSES)) {
        if (!cause.motRuleIds?.includes(ruleId)) continue;
        const weight = motWeight(item.monthsSince);
        scores.set(cause.id, (scores.get(cause.id) ?? 0) + weight);
        const where = item.defect.location.label ? `${item.defect.location.label.toLowerCase()}: ` : "";
        const list = motEvidence.get(cause.id) ?? [];
        list.push(`${where}${item.defect.explanation.title} was noted at the last MOT.`);
        motEvidence.set(cause.id, list);
      }
    }
  }

  // 3. OBD-II codes.
  for (const code of codes) {
    for (const cause of Object.values(CAUSES)) {
      const pointsHere = cause.jobId && code.jobIds.includes(cause.jobId);
      if (!pointsHere) continue;
      scores.set(cause.id, (scores.get(cause.id) ?? 0) + 4);
      noteReason(cause.id, `Fault code ${code.code} points at this area.`);
    }
  }

  const ranked: RankedCause[] = [...scores.entries()]
    .filter(([causeId, score]) => score > 0 && CAUSES[causeId])
    .map(([causeId, score]) => ({ causeId, score }))
    .sort((a, b) => b.score - a.score)
    .map(({ causeId, score }) => {
      const top = Math.max(...[...scores.values()], 1);
      return {
        cause: CAUSES[causeId],
        score,
        confidence: confidenceFor(score, top),
        reasons: reasons.get(causeId) ?? [],
        motEvidence: motEvidence.get(causeId) ?? [],
      };
    });

  return {
    symptom,
    answered,
    totalQuestions: symptom.questions.length,
    causes: ranked,
    safetyStop: symptom.safetyStop,
  };
}
