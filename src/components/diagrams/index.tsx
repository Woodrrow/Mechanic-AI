import type { DiagramId } from "@/lib/jobs/types";
import { BatteryTerminals } from "./battery-terminals";
import { DiscBrakeCorner } from "./disc-brake-corner";
import { EngineBay } from "./engine-bay";
import { SerpentineBelt } from "./serpentine-belt";
import { SuspensionStrut } from "./suspension-strut";

export type DiagramLabels = Record<string, string | null | undefined>;

const DIAGRAMS: Record<DiagramId, (props: { labels?: DiagramLabels }) => React.ReactElement> = {
  "disc-brake-corner": DiscBrakeCorner,
  "engine-bay": EngineBay,
  "battery-terminals": BatteryTerminals,
  "suspension-strut": SuspensionStrut,
  "serpentine-belt": SerpentineBelt,
};

export function Diagram({ id, labels }: { id: DiagramId; labels?: DiagramLabels }) {
  const Component = DIAGRAMS[id];
  return Component ? <Component labels={labels} /> : null;
}
