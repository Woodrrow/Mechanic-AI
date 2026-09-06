import type { ReactNode } from "react";

export interface Callout {
  key: string;
  n: number;
  text: string;
}

/** Shared shell: the drawing, a numbered key, and a caption that never claims accuracy it does not have. */
export function DiagramFigure({
  title,
  viewBox,
  children,
  callouts,
  caption,
}: {
  title: string;
  viewBox: string;
  children: ReactNode;
  callouts: Callout[];
  caption?: string;
}) {
  const id = `diagram-${title.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <figure className="rounded-2xl border border-border bg-card p-4">
      <svg viewBox={viewBox} role="img" aria-labelledby={id} className="h-auto w-full text-foreground">
        <title id={id}>{title}</title>
        {children}
      </svg>
      <ol className="mt-3 space-y-1 text-sm">
        {callouts.map((c) => (
          <li key={c.key} className="flex gap-2">
            <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground">
              {c.n}
            </span>
            <span>{c.text}</span>
          </li>
        ))}
      </ol>
      <figcaption className="mt-3 text-xs text-muted">
        {caption ?? "Schematic, not to scale and not a specific car. It shows which part is which, not exactly where yours sits."}
      </figcaption>
    </figure>
  );
}

export function CalloutMarker({ n, x, y, tx, ty }: { n: number; x: number; y: number; tx: number; ty: number }) {
  return (
    <g>
      <line x1={x} y1={y} x2={tx} y2={ty} stroke="currentColor" strokeWidth={1} strokeDasharray="3 3" />
      <circle cx={tx} cy={ty} r={9} fill="var(--accent)" />
      <text x={tx} y={ty + 3.5} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--accent-foreground)">
        {n}
      </text>
    </g>
  );
}

/** Merge model-supplied labels over the defaults, in a fixed order. */
export function buildCallouts(
  order: string[],
  defaults: Record<string, string>,
  labels: Record<string, string | null | undefined> = {},
): Callout[] {
  return order.map((key, i) => ({ key, n: i + 1, text: labels[key] ?? defaults[key] }));
}
