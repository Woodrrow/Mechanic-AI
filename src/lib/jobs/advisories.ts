/** The owner's own MOT items that bear on a job. Layered onto the shared guide at render time. */
import type { HistoryAnalysis, OpenItem, ResolvedItem } from "@/lib/mot/types";
import type { JobDefinition } from "./types";

export interface JobAdvisories {
  open: OpenItem[];
  past: ResolvedItem[];
}

export function relevantAdvisories(analysis: HistoryAnalysis | null, job: JobDefinition, maxPast = 3): JobAdvisories {
  if (!analysis) return { open: [], past: [] };
  const relevant = (ruleId: string | null) => ruleId !== null && job.motRuleIds.includes(ruleId);
  return {
    open: analysis.openItems.filter((i) => relevant(i.defect.explanation.ruleId)),
    past: analysis.resolvedItems.filter((i) => relevant(i.defect.explanation.ruleId)).slice(0, maxPast),
  };
}
