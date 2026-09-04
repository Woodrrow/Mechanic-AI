import { SOURCE_DESCRIPTION, SOURCE_LABEL } from "@/lib/vehicle/format";
import type { Provenance, Source } from "@/lib/vehicle/types";
import { Badge } from "./ui";

export function SourceBadge({ source, fixture }: { source: Source; fixture?: boolean }) {
  const label = SOURCE_LABEL[source];
  return (
    <Badge tone={source === "user" ? "accent" : "neutral"} title={SOURCE_DESCRIPTION[source]}>
      {fixture && source !== "user" ? `${label} · demo` : label}
    </Badge>
  );
}

/** The badge for a field, or nothing if no source claimed it. */
export function FieldSource({
  field,
  provenance,
  fixture,
}: {
  field: string;
  provenance: Provenance[];
  fixture?: boolean;
}) {
  // The last entry wins: user confirmation overrides a provider value.
  const entry = [...provenance].reverse().find((p) => p.field === field);
  if (!entry) return null;
  return (
    <span className="inline-flex items-center gap-1" title={entry.note}>
      <SourceBadge source={entry.source} fixture={fixture} />
      {entry.note ? <span className="text-xs text-warn">*</span> : null}
    </span>
  );
}
