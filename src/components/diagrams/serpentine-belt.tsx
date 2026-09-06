import { buildCallouts, CalloutMarker, DiagramFigure } from "./figure";

const DEFAULTS: Record<string, string> = {
  belt: "The belt: photograph its routing before it comes off",
  crankPulley: "Crankshaft pulley, at the bottom of the engine",
  alternator: "Alternator pulley",
  acCompressor: "Air-conditioning compressor pulley",
  waterPump: "Water pump or power-steering pump pulley",
  tensioner: "Automatic tensioner: lever this back to release the belt",
  idler: "Idler pulley, guides the belt",
};

const ORDER = ["belt", "crankPulley", "alternator", "acCompressor", "waterPump", "tensioner", "idler"];

/** Auxiliary belt layout seen from the end of the engine. Routing differs per engine. */
export function SerpentineBelt({ labels }: { labels?: Record<string, string | null | undefined> }) {
  const stroke = "currentColor";
  const pulley = (cx: number, cy: number, r: number) => (
    <>
      <circle cx={cx} cy={cy} r={r} fill="var(--card)" stroke={stroke} strokeWidth={2} />
      <circle cx={cx} cy={cy} r={r * 0.35} fill="var(--border)" stroke={stroke} strokeWidth={1.2} />
    </>
  );
  return (
    <DiagramFigure
      title="Auxiliary drive belt layout seen from the end of the engine"
      viewBox="0 0 420 320"
      callouts={buildCallouts(ORDER, DEFAULTS, labels)}
      caption="An example layout. Yours will differ: most cars carry a routing sticker under the bonnet, and a photo before you start is worth more than any diagram."
    >
      <path
        d="M120 250 A48 48 0 0 1 168 202 L280 96 A28 28 0 0 1 330 118 A26 26 0 0 1 300 168 L232 214 A22 22 0 0 1 196 236 A48 48 0 0 1 120 250 Z"
        fill="none"
        stroke={stroke}
        strokeWidth={7}
        strokeLinejoin="round"
        opacity={0.55}
      />
      {pulley(160, 246, 44)}
      {pulley(300, 96, 30)}
      {pulley(340, 176, 26)}
      {pulley(236, 150, 24)}
      {pulley(216, 226, 18)}
      {pulley(120, 148, 16)}
      <path d="M216 226 l-26 -20" stroke={stroke} strokeWidth={4} strokeLinecap="round" />
      <text x={160} y={252} fontSize={11} fill="var(--muted)" textAnchor="middle">
        crank
      </text>
      <CalloutMarker n={1} x={252} y={128} tx={196} ty={70} />
      <CalloutMarker n={2} x={160} y={246} tx={62} ty={288} />
      <CalloutMarker n={3} x={300} y={96} tx={368} ty={44} />
      <CalloutMarker n={4} x={340} y={176} tx={398} ty={216} />
      <CalloutMarker n={5} x={236} y={150} tx={286} ty={252} />
      <CalloutMarker n={6} x={216} y={226} tx={166} ty={310} />
      <CalloutMarker n={7} x={120} y={148} tx={44} ty={124} />
    </DiagramFigure>
  );
}
