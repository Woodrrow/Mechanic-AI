import { PROVIDER_LABEL, type ProviderName } from "@/lib/providers/errors";
import type { ProviderReports, ProviderStatus } from "@/lib/vehicle/lookup";
import { Badge } from "./ui";

const TONE: Record<ProviderStatus, "ok" | "accent" | "neutral" | "warn"> = {
  live: "ok",
  fixture: "accent",
  skipped: "neutral",
  failed: "warn",
};

const SHORT: Record<ProviderName, string> = { dvla_ves: "DVLA", dvsa_mot: "DVSA", nhtsa_vpic: "NHTSA" };

export function ProviderStatusLine({ providers }: { providers: ProviderReports }) {
  const entries = (Object.entries(providers) as Array<[ProviderName, { status: ProviderStatus; detail?: string }]>).filter(
    ([, r]) => r.status !== "skipped",
  );
  if (entries.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Data sources used">
      {entries.map(([name, r]) => (
        <li key={name} title={`${PROVIDER_LABEL[name]}${r.detail ? `: ${r.detail}` : ""}`}>
          <Badge tone={TONE[r.status]}>
            {SHORT[name]} · {r.status === "fixture" ? "demo" : r.status}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
