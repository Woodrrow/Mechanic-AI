import { buildCallouts, CalloutMarker, DiagramFigure } from "./figure";

const DEFAULTS: Record<string, string> = {
  topMount: "Strut top mount, reached from under the bonnet",
  spring: "Coil spring: never compress one at home",
  damper: "Damper (shock absorber) body",
  knuckle: "Hub and steering knuckle",
  lowerArm: "Lower suspension arm",
  ballJoint: "Lower ball joint, where the arm meets the knuckle",
  dropLink: "Anti-roll bar drop link",
  trackRodEnd: "Track rod end, from the steering rack",
};

const ORDER = ["topMount", "spring", "damper", "knuckle", "lowerArm", "ballJoint", "dropLink", "trackRodEnd"];

/** Front strut corner seen from the front of the car, wheel removed. */
export function SuspensionStrut({ labels }: { labels?: Record<string, string | null | undefined> }) {
  const stroke = "currentColor";
  return (
    <DiagramFigure
      title="Front suspension strut and lower arm, seen from the front of the car with the wheel removed"
      viewBox="0 0 420 340"
      callouts={buildCallouts(ORDER, DEFAULTS, labels)}
    >
      <path d="M20 40 h380" stroke={stroke} strokeWidth={2} strokeDasharray="6 4" />
      <text x={70} y={30} fontSize={11} fill="var(--muted)">
        inner wing / bonnet side
      </text>
      <ellipse cx={220} cy={52} rx={34} ry={12} fill="var(--border)" stroke={stroke} strokeWidth={2} />
      <circle cx={198} cy={52} r={4} fill="var(--card)" stroke={stroke} strokeWidth={1.2} />
      <circle cx={242} cy={52} r={4} fill="var(--card)" stroke={stroke} strokeWidth={1.2} />
      <path
        d="M196 70 h48 M196 92 h48 M196 114 h48 M196 136 h48 M196 158 h48"
        stroke={stroke}
        strokeWidth={5}
        strokeLinecap="round"
        opacity={0.75}
      />
      <rect x={210} y={64} width={20} height={140} rx={6} fill="var(--card)" stroke={stroke} strokeWidth={2} />
      <path d="M206 204 h28 v46 h-28 z" fill="var(--border)" stroke={stroke} strokeWidth={2} />
      <path d="M186 208 h68 v78 h-68 z" fill="var(--card)" stroke={stroke} strokeWidth={2} />
      <circle cx={220} cy={244} r={20} fill="var(--border)" stroke={stroke} strokeWidth={2} />
      <path d="M186 286 L92 300 L70 288 L92 274 Z" fill="var(--border)" stroke={stroke} strokeWidth={2} />
      <circle cx={186} cy={286} r={9} fill="var(--accent)" stroke={stroke} strokeWidth={1.5} />
      <path d="M240 120 l58 22" stroke={stroke} strokeWidth={5} strokeLinecap="round" />
      <circle cx={300} cy={143} r={7} fill="var(--card)" stroke={stroke} strokeWidth={1.5} />
      <path d="M300 143 h96" stroke={stroke} strokeWidth={4} />
      <path d="M254 244 h100" stroke={stroke} strokeWidth={6} strokeLinecap="round" />
      <circle cx={264} cy={244} r={8} fill="var(--card)" stroke={stroke} strokeWidth={1.5} />
      <text x={370} y={236} fontSize={10} fill="var(--muted)" textAnchor="middle">
        to the rack
      </text>
      <CalloutMarker n={1} x={220} y={52} tx={120} ty={60} />
      <CalloutMarker n={2} x={196} y={114} tx={110} ty={120} />
      <CalloutMarker n={3} x={220} y={186} tx={130} ty={186} />
      <CalloutMarker n={4} x={220} y={244} tx={150} ty={330} />
      <CalloutMarker n={5} x={120} y={288} tx={60} ty={330} />
      <CalloutMarker n={6} x={186} y={286} tx={236} ty={318} />
      <CalloutMarker n={7} x={340} y={143} tx={390} ty={100} />
      <CalloutMarker n={8} x={330} y={244} tx={392} ty={278} />
    </DiagramFigure>
  );
}
