/** MOT inspection manual top-level areas (2018+ manual; legacy codes are mapped onto the same set). */
export type MotCategory =
  | "brakes"
  | "steering"
  | "visibility"
  | "lamps_electrics"
  | "wheels_tyres"
  | "suspension"
  | "body_structure"
  | "other_equipment"
  | "nuisance_emissions"
  | "unknown";

export const CATEGORY_LABEL: Record<MotCategory, string> = {
  brakes: "Brakes",
  steering: "Steering",
  visibility: "Visibility",
  lamps_electrics: "Lights & electrics",
  wheels_tyres: "Wheels & tyres",
  suspension: "Suspension",
  body_structure: "Body & structure",
  other_equipment: "Seat belts & equipment",
  nuisance_emissions: "Leaks, exhaust & emissions",
  unknown: "Other",
};

export type DefectType = "advisory" | "minor" | "major" | "dangerous" | "fail" | "prs" | "user_entered" | "other";

export interface ManualReference {
  /** As printed, e.g. "5.2.3 (e)" or "4.1.E.1". */
  code: string;
  /** Numeric section, e.g. "5.2.3". */
  section: string;
  format: "current" | "legacy";
}

export interface DefectLocation {
  side: "nearside" | "offside" | null;
  position: "front" | "rear" | null;
  qualifiers: string[];
  /** Human label, e.g. "Nearside front", or null. */
  label: string | null;
}

export interface ParsedDefect {
  raw: string;
  /** Description with location prefix and manual code removed. */
  text: string;
  location: DefectLocation;
  reference: ManualReference | null;
  category: MotCategory;
  type: DefectType;
  dangerous: boolean;
}

export type JobTier = "green" | "amber" | "red";

export type Urgency = "now" | "soon" | "monitor" | "info";

export type JobVenue = "home" | "garage" | "tyre_shop" | "windscreen";

export interface SuggestedJob {
  name: string;
  tier: JobTier;
  where: JobVenue;
  summary: string;
}

export interface Explanation {
  ruleId: string | null;
  title: string;
  meaning: string;
  whyItMatters: string;
  /** True for things that get worse with miles and time (pads, tyres, leaks). */
  wearItem: boolean;
  urgency: Urgency;
  job: SuggestedJob | null;
}

export interface ExplainedDefect extends ParsedDefect {
  explanation: Explanation;
  /** Stable identity across tests: rule + corner, or normalised text + corner. */
  key: string;
}

export interface ParsedTest {
  id: string;
  completedDate: string;
  result: "passed" | "failed";
  expiryDate: string | null;
  odometerMiles: number | null;
  odometerRaw: string | null;
  defects: ExplainedDefect[];
}

export interface ItemStatus {
  text: string;
  tone: "ok" | "warn" | "danger" | "neutral";
}

export interface OpenItem {
  defect: ExplainedDefect;
  test: ParsedTest;
  monthsSince: number;
  estimatedMilesSince: number | null;
  timesNoted: number;
  firstNoted: string;
  status: ItemStatus;
}

export interface ResolvedItem {
  defect: ExplainedDefect;
  notedAt: string;
  clearedAt: string;
  sameDay: boolean;
  /** PRS: fixed at the test station during the test. */
  atStation: boolean;
}

export interface HistoryAnalysis {
  tests: ParsedTest[];
  testCount: number;
  firstTestDate: string | null;
  latestTest: ParsedTest | null;
  latestMileage: number | null;
  milesPerYear: number | null;
  openItems: OpenItem[];
  resolvedItems: ResolvedItem[];
}
