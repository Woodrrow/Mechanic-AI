import type { ReactNode } from "react";

export interface DiscBrakeLabels {
  caliper?: string | null;
  carrier?: string | null;
  pads?: string | null;
  disc?: string | null;
  guidePins?: string | null;
  bleedNipple?: string | null;
  hub?: string | null;
}

const DEFAULT_LABELS: Required<{ [K in keyof DiscBrakeLabels]: string }> = {
  disc: "Disc: the plate the pads grip",
  pads: "Inner and outer pads, one each side of the disc",
  caliper: "Caliper: houses the piston and holds the pads",
  guidePins: "Guide-pin bolts: remove these to swing the caliper off the pads",
  carrier: "Carrier bracket: bolted to the hub; its big bolts stay put for a pad change",
  bleedNipple: "Bleed nipple: for the hydraulic system; not opened for pads",
  hub: "Hub and steering knuckle",
};

const ORDER: Array<keyof DiscBrakeLabels> = ["disc", "pads", "caliper", "guidePins", "carrier", "bleedNipple", "hub"];

/**
 * Schematic cross-section of a sliding-caliper disc brake, viewed from above
 * with the wheel to the right. Deliberately not to scale and not a specific
 * car: it exists to show which part is which and which bolts a pad change touches.
 */
export function DiscBrakeCorner({ labels = {}, caption }: { labels?: DiscBrakeLabels; caption?: ReactNode }) {
  const text = ORDER.map((key, i) => ({ key, n: i + 1, text: labels[key] ?? DEFAULT_LABELS[key] }));
  const stroke = "currentColor";
  const callout = (n: number, x: number, y: number, tx: number, ty: number) => (
    <g key={`c${n}`}>
      <line x1={x} y1={y} x2={tx} y2={ty} stroke={stroke} strokeWidth={1} strokeDasharray="3 3" />
      <circle cx={tx} cy={ty} r={9} fill="var(--accent)" />
      <text x={tx} y={ty + 3.5} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--accent-foreground)">
        {n}
      </text>
    </g>
  );

  return (
    <figure className="rounded-2xl border border-border bg-card p-4">
      <svg viewBox="0 0 420 300" role="img" aria-labelledby="disc-brake-title" className="h-auto w-full text-foreground">
        <title id="disc-brake-title">Cross-section of a front disc brake, seen from above, wheel to the right</title>

        {/* hub / knuckle */}
        <rect x={30} y={120} width={70} height={150} rx={6} fill="var(--border)" stroke={stroke} strokeWidth={1.5} />
        {/* carrier bracket */}
        <path d="M100 150 h180 v16 h-180 z" fill="var(--border)" stroke={stroke} strokeWidth={1.5} />
        <path d="M100 150 v-100 h20 v100 z M260 150 v-100 h20 v100 z" fill="var(--border)" stroke={stroke} strokeWidth={1.5} />
        {/* carrier bolts into knuckle */}
        <circle cx={112} cy={195} r={7} fill="var(--card)" stroke={stroke} strokeWidth={1.5} />
        <circle cx={112} cy={245} r={7} fill="var(--card)" stroke={stroke} strokeWidth={1.5} />
        {/* disc, edge-on */}
        <rect x={205} y={20} width={12} height={260} fill="var(--muted)" stroke={stroke} strokeWidth={1.5} />
        {/* caliper body: inboard block, bridge, outboard finger */}
        <path
          d="M125 40 h60 v100 h-60 z M125 40 h130 v18 h-130 z M235 40 h20 v100 h-20 z"
          fill="var(--card)"
          stroke={stroke}
          strokeWidth={2}
        />
        {/* piston */}
        <rect x={150} y={70} width={35} height={50} rx={4} fill="var(--border)" stroke={stroke} strokeWidth={1.5} />
        {/* pads */}
        <rect x={188} y={60} width={14} height={72} fill="var(--warn)" stroke={stroke} strokeWidth={1.5} />
        <rect x={220} y={60} width={14} height={72} fill="var(--warn)" stroke={stroke} strokeWidth={1.5} />
        {/* guide-pin bolts on the inboard face, with pins running into the carrier */}
        <circle cx={132} cy={64} r={7} fill="var(--accent)" stroke={stroke} strokeWidth={1.5} />
        <circle cx={132} cy={128} r={7} fill="var(--accent)" stroke={stroke} strokeWidth={1.5} />
        <line x1={139} y1={64} x2={185} y2={64} stroke={stroke} strokeWidth={1} strokeDasharray="2 2" />
        <line x1={139} y1={128} x2={185} y2={128} stroke={stroke} strokeWidth={1} strokeDasharray="2 2" />
        {/* bleed nipple */}
        <rect x={160} y={28} width={8} height={12} fill="var(--card)" stroke={stroke} strokeWidth={1.5} />
        {/* brake hose */}
        <path d="M125 100 c-30 0 -40 20 -55 30" fill="none" stroke={stroke} strokeWidth={2} />
        {/* wheel side marker */}
        <text x={330} y={150} fontSize={11} fill="var(--muted)" textAnchor="middle">
          wheel this side →
        </text>

        {callout(1, 211, 230, 260, 230)}
        {callout(2, 227, 96, 290, 96)}
        {callout(3, 245, 49, 300, 30)}
        {callout(4, 132, 128, 75, 60)}
        {callout(5, 190, 158, 330, 190)}
        {callout(6, 164, 34, 110, 20)}
        {callout(7, 65, 195, 65, 285)}
      </svg>
      <ol className="mt-3 space-y-1 text-sm">
        {text.map((item) => (
          <li key={item.key} className="flex gap-2">
            <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground">
              {item.n}
            </span>
            <span>{item.text}</span>
          </li>
        ))}
      </ol>
      <figcaption className="mt-3 text-xs text-muted">
        {caption ?? "Schematic, not to scale and not a specific car. It shows which part is which and which bolts a pad change touches."}
      </figcaption>
    </figure>
  );
}
