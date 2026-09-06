import { DIAGRAM_LABELS } from "@/lib/jobs/diagrams";
import { buildCallouts, CalloutMarker, DiagramFigure } from "./figure";

const DEFAULTS: Record<string, string> = {
  disc: "Disc: the plate the pads grip",
  pads: "Inner and outer pads, one each side of the disc",
  caliper: "Caliper: houses the piston and holds the pads",
  guidePins: "Guide-pin bolts: remove these to swing the caliper off the pads",
  carrier: "Carrier bracket: bolted to the hub; its big bolts stay put for a pad change",
  bleedNipple: "Bleed nipple: for the hydraulic system; not opened for pads",
  hub: "Hub and steering knuckle",
};

const ORDER = Object.keys(DIAGRAM_LABELS["disc-brake-corner"]).sort(
  (a, b) => ["disc", "pads", "caliper", "guidePins", "carrier", "bleedNipple", "hub"].indexOf(a) - ["disc", "pads", "caliper", "guidePins", "carrier", "bleedNipple", "hub"].indexOf(b),
);

/** Cross-section of a sliding-caliper disc brake, seen from above with the wheel to the right. */
export function DiscBrakeCorner({ labels }: { labels?: Record<string, string | null | undefined> }) {
  const stroke = "currentColor";
  return (
    <DiagramFigure
      title="Cross-section of a front disc brake, seen from above, wheel to the right"
      viewBox="0 0 420 300"
      callouts={buildCallouts(ORDER, DEFAULTS, labels)}
      caption="Schematic, not to scale and not a specific car. It shows which part is which and which bolts a pad change touches."
    >
      <rect x={30} y={120} width={70} height={150} rx={6} fill="var(--border)" stroke={stroke} strokeWidth={1.5} />
      <path d="M100 150 h180 v16 h-180 z" fill="var(--border)" stroke={stroke} strokeWidth={1.5} />
      <path d="M100 150 v-100 h20 v100 z M260 150 v-100 h20 v100 z" fill="var(--border)" stroke={stroke} strokeWidth={1.5} />
      <circle cx={112} cy={195} r={7} fill="var(--card)" stroke={stroke} strokeWidth={1.5} />
      <circle cx={112} cy={245} r={7} fill="var(--card)" stroke={stroke} strokeWidth={1.5} />
      <rect x={205} y={20} width={12} height={260} fill="var(--muted)" stroke={stroke} strokeWidth={1.5} />
      <path d="M125 40 h60 v100 h-60 z M125 40 h130 v18 h-130 z M235 40 h20 v100 h-20 z" fill="var(--card)" stroke={stroke} strokeWidth={2} />
      <rect x={150} y={70} width={35} height={50} rx={4} fill="var(--border)" stroke={stroke} strokeWidth={1.5} />
      <rect x={188} y={60} width={14} height={72} fill="var(--warn)" stroke={stroke} strokeWidth={1.5} />
      <rect x={220} y={60} width={14} height={72} fill="var(--warn)" stroke={stroke} strokeWidth={1.5} />
      <circle cx={132} cy={64} r={7} fill="var(--accent)" stroke={stroke} strokeWidth={1.5} />
      <circle cx={132} cy={128} r={7} fill="var(--accent)" stroke={stroke} strokeWidth={1.5} />
      <line x1={139} y1={64} x2={185} y2={64} stroke={stroke} strokeWidth={1} strokeDasharray="2 2" />
      <line x1={139} y1={128} x2={185} y2={128} stroke={stroke} strokeWidth={1} strokeDasharray="2 2" />
      <rect x={160} y={28} width={8} height={12} fill="var(--card)" stroke={stroke} strokeWidth={1.5} />
      <path d="M125 100 c-30 0 -40 20 -55 30" fill="none" stroke={stroke} strokeWidth={2} />
      <text x={330} y={150} fontSize={11} fill="var(--muted)" textAnchor="middle">
        wheel this side →
      </text>
      <CalloutMarker n={1} x={211} y={230} tx={260} ty={230} />
      <CalloutMarker n={2} x={227} y={96} tx={290} ty={96} />
      <CalloutMarker n={3} x={245} y={49} tx={300} ty={30} />
      <CalloutMarker n={4} x={132} y={128} tx={75} ty={60} />
      <CalloutMarker n={5} x={190} y={158} tx={330} ty={190} />
      <CalloutMarker n={6} x={164} y={34} tx={110} ty={20} />
      <CalloutMarker n={7} x={65} y={195} tx={65} ty={285} />
    </DiagramFigure>
  );
}
