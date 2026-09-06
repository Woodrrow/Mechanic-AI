import { buildCallouts, CalloutMarker, DiagramFigure } from "./figure";

const DEFAULTS: Record<string, string> = {
  oilFiller: "Engine oil filler cap, on top of the engine",
  dipstick: "Oil dipstick, usually a bright loop on the side of the engine",
  coolantTank: "Coolant expansion tank, translucent with MIN and MAX marks",
  brakeFluid: "Brake fluid reservoir, at the back near the bulkhead",
  washerBottle: "Screenwash bottle, with a windscreen symbol on the cap",
  airFilterBox: "Air filter box, a large plastic box with a wide hose",
  battery: "Battery",
  fuseBox: "Under-bonnet fuse box",
  engineCover: "Engine cover or the top of the engine",
};

const ORDER = ["engineCover", "oilFiller", "dipstick", "coolantTank", "brakeFluid", "washerBottle", "airFilterBox", "battery", "fuseBox"];

/** Typical transverse-engine bay from above. Layout varies by car; this is orientation, not a map. */
export function EngineBay({ labels }: { labels?: Record<string, string | null | undefined> }) {
  const stroke = "currentColor";
  const box = (x: number, y: number, w: number, h: number, fill = "var(--card)") => (
    <rect x={x} y={y} width={w} height={h} rx={6} fill={fill} stroke={stroke} strokeWidth={1.5} />
  );
  return (
    <DiagramFigure
      title="Typical engine bay from above, front of the car at the bottom"
      viewBox="0 0 420 320"
      callouts={buildCallouts(ORDER, DEFAULTS, labels)}
      caption="A typical transverse engine bay. Every car differs: use this to know what you are looking for, then find it on yours."
    >
      <rect x={20} y={20} width={380} height={270} rx={12} fill="none" stroke={stroke} strokeWidth={2} strokeDasharray="6 4" />
      <text x={210} y={306} fontSize={11} fill="var(--muted)" textAnchor="middle">
        front of the car
      </text>
      <text x={210} y={14} fontSize={11} fill="var(--muted)" textAnchor="middle">
        bulkhead (windscreen side)
      </text>
      {box(120, 110, 180, 110, "var(--border)")}
      <text x={210} y={170} fontSize={12} fill="var(--muted)" textAnchor="middle">
        engine
      </text>
      <circle cx={160} cy={128} r={13} fill="var(--card)" stroke={stroke} strokeWidth={1.5} />
      <path d="M262 118 v34" stroke={stroke} strokeWidth={4} strokeLinecap="round" />
      <circle cx={262} cy={114} r={6} fill="var(--warn)" stroke={stroke} strokeWidth={1.5} />
      {box(316, 96, 68, 84)}
      {box(36, 40, 74, 52)}
      {box(316, 34, 68, 44)}
      {box(36, 108, 70, 74)}
      {box(150, 236, 130, 44)}
      <text x={215} y={262} fontSize={10} fill="var(--muted)" textAnchor="middle">
        radiator / cooling pack
      </text>
      <CalloutMarker n={1} x={210} y={200} tx={210} ty={214} />
      <CalloutMarker n={2} x={160} y={128} tx={122} ty={72} />
      <CalloutMarker n={3} x={262} y={124} tx={300} ty={70} />
      <CalloutMarker n={4} x={350} y={138} tx={396} ty={186} />
      <CalloutMarker n={5} x={73} y={66} tx={30} ty={30} />
      <CalloutMarker n={6} x={350} y={56} tx={398} ty={34} />
      <CalloutMarker n={7} x={71} y={145} tx={28} ty={196} />
      <CalloutMarker n={8} x={71} y={172} tx={30} ty={244} />
      <CalloutMarker n={9} x={110} y={120} tx={108} ty={272} />
    </DiagramFigure>
  );
}
