import { buildCallouts, CalloutMarker, DiagramFigure } from "./figure";

const DEFAULTS: Record<string, string> = {
  negativeTerminal: "Negative (−) terminal: off first, on last. Usually black.",
  positiveTerminal: "Positive (+) terminal: often under a red cover. On last, off first is the wrong way round.",
  holdDownClamp: "Hold-down clamp or bracket at the base",
  vent: "Vent tube, if fitted: it must be refitted to the new battery",
};

const ORDER = ["negativeTerminal", "positiveTerminal", "holdDownClamp", "vent"];

export function BatteryTerminals({ labels }: { labels?: Record<string, string | null | undefined> }) {
  const stroke = "currentColor";
  return (
    <DiagramFigure
      title="Car battery seen from the front, showing both terminals and the hold-down clamp"
      viewBox="0 0 420 260"
      callouts={buildCallouts(ORDER, DEFAULTS, labels)}
      caption="Negative first off, negative last on. That order is what stops a spanner shorting to the bodywork."
    >
      <rect x={100} y={70} width={220} height={130} rx={8} fill="var(--card)" stroke={stroke} strokeWidth={2} />
      <rect x={100} y={70} width={220} height={22} rx={8} fill="var(--border)" stroke={stroke} strokeWidth={1.5} />
      <circle cx={145} cy={64} r={16} fill="var(--border)" stroke={stroke} strokeWidth={2} />
      <text x={145} y={70} fontSize={18} fontWeight={700} textAnchor="middle" fill="currentColor">
        −
      </text>
      <circle cx={275} cy={64} r={16} fill="var(--danger)" stroke={stroke} strokeWidth={2} />
      <text x={275} y={70} fontSize={18} fontWeight={700} textAnchor="middle" fill="var(--card)">
        +
      </text>
      <path d="M100 200 h220 v14 h-220 z" fill="var(--border)" stroke={stroke} strokeWidth={1.5} />
      <path d="M118 214 v22 M302 214 v22" stroke={stroke} strokeWidth={3} />
      <path d="M320 120 c30 0 40 20 60 24" fill="none" stroke={stroke} strokeWidth={2} />
      <text x={210} y={150} fontSize={12} fill="var(--muted)" textAnchor="middle">
        battery
      </text>
      <CalloutMarker n={1} x={145} y={48} tx={70} ty={34} />
      <CalloutMarker n={2} x={275} y={48} tx={352} ty={34} />
      <CalloutMarker n={3} x={210} y={214} tx={210} ty={246} />
      <CalloutMarker n={4} x={370} y={142} tx={398} ty={176} />
    </DiagramFigure>
  );
}
